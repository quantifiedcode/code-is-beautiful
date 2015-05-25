function initLegend(legendEl) {
  var legend = d3.select(legendEl);
  
  function legendMarkup(d) {
      return "<p><b>" + (d.path || "/") + "</b></p><p>" + d.lines + " lines of code, " + d.chars + " characters</p>"
  }
  
  return {
    update: function(d) {
      legend.html(legendMarkup(d));
      legend.transition().duration(200).style("opacity","1");
    },
    remove: function(d) {
      legend.transition().duration(1000).style("opacity","0");
    }
  };
}

function initChart(chartEl, legend, scene) {
    var diameter = 1000,
        format = d3.format(",d"),
        color = d3.scale.category20c();

    var layout = d3.layout.treemap()
        .size([diameter, diameter])
        .sticky(true)
        .padding(5)
        .value(function(d) { return d.lines; });

    var svg = d3.select(chartEl).append("div")
        .style("position", "relative")
        .style("width", diameter + "px")
        .style("height", diameter + "px")
        .attr("class", "treemap");

    function position() {
      this.style("left", function(d) { return d.x + "px"; })
          .style("top", function(d) { return d.y + "px"; })
          .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
          .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
    }

    d3.json("metrics.json", function(error, root) {
      	var list = root.summary.python.metrics;
      	var tree = treeize(list);
        var nodes = layout.nodes(tree);
        var node = svg.selectAll(".node")
          .data(nodes)
          .enter().append("div")
            .attr("class", "node")
            .call(position)
            .style("background-color", function(d) { return color(d.depth); })
            .each(function(d) { scene.addHouse(d, d.x, d.y, d.dx, d.dy, d.depth, color(d.depth)); });

        node.append("title")
            .text(function(d) { return d.path + ": " + format(d.lines); });

        if (legend) {
          node.on("mouseover", legend.update)
            .on("mouseout", legend.remove);  
        }
        
        scene.render();
        scene.animate();
    });
}

function initScene(canvasEl, legend) {
  var width = 1000, height = 1000;
  var canvas = d3.select(canvasEl);
  var mouse = new THREE.Vector2();
  var raycaster = new THREE.Raycaster();
  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 1000 );
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  var intersected;
  var rootHouse;
  
  function render() {  
    renderer.render(scene, camera);
  }
  
  function animate() {
    requestAnimationFrame(animate);    
  }
  
  function onCanvasMouseMove(event) {
    var e = event;
    var et = e.target;
  
    e.preventDefault();
  
    mouse.x = ((e.pageX - et.offsetLeft) / et.clientWidth) * 2 - 1;
    mouse.y = - ((e.pageY - et.offsetTop) / et.clientHeight) * 2 + 1;
    
		raycaster.setFromCamera(mouse, camera);

		var intersects = raycaster.intersectObjects(rootHouse ? [rootHouse].concat(rootHouse.children) : []);

		if (intersects.length > 0) {
			if (intersected != intersects[0].object) {
				if (intersected) {
          intersected.material.emissive.setHex(intersected.currentHex);
        }
      
				intersected = intersects[ 0 ].object;
				intersected.currentHex = intersected.material.emissive.getHex();
				intersected.material.emissive.setHex( 0xff0000 );
        
        legend.update(intersected.d);
        render();
			}

		}
    else if (intersected) {
      intersected.material.emissive.setHex(intersected.currentHex);
			intersected = null;      

      legend.remove();
      render();
		}
  }

  renderer.setSize(width, height);
  renderer.setClearColor( 0xffffff, 1);
  canvas.node().appendChild(renderer.domElement);

  //camera.position.x = -1;
  camera.position.y = -3;
  camera.position.z = 2;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
  directionalLight.position.set(-10, -20, 40);
  scene.add(directionalLight);
  
  // add subtle ambient lighting
  var ambientLight = new THREE.AmbientLight(0x313131);
  scene.add(ambientLight);

  renderer.domElement.addEventListener('mousemove', onCanvasMouseMove, false);

  function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
  
  return {
    addHouse: function(d, x, y, w, h, level, color) {
      var houseHeight;
      
      if (d.children) {
        houseHeight = 1;
      }
      else {
        houseHeight = 1 + (d.chars / 5665);
      }

      var depth = 10 / 1000;
      var gw = Math.max(0, w - 1) / 500;
      var gh = Math.max(0, h - 1) / 500;
      var gd = depth * houseHeight;

      var gx = x / 500 + gw / 2 - 1;
      var gy = 1 - (y / 500 + gh / 2);
      var gz = level * depth + gd / 2;

      console.log('adding house <', d.path, '> (', d.chars, houseHeight, ')');

      var geometry = new THREE.BoxGeometry(gw, gh, gd);
      var material = new THREE.MeshLambertMaterial( { color: color } );
      var cube = new THREE.Mesh( geometry, material );

      cube.position.x = gx;
      cube.position.y = gy;
      cube.position.z = gz;
      
      cube.castShadow = true;

      cube.d = d;
      
      var objToAdd = rootHouse || scene;
      objToAdd.add( cube );
      
      if (!rootHouse) {
        rootHouse = cube;
        rootHouse.rotation.z = Math.PI / 4;
      }
    },
    
    render: render,
    animate: animate
  };
}

function treeize(list) {
  var tree = {};
  
  for (path in list) {
    if (list.hasOwnProperty(path)) {
      addChild(tree, path.split('/'), path, list[path]);
    }
  }
  
  return tree;
}

function addChild(tree, nameList, path, node) {
  var nameFirst = nameList.shift();
  var child;

  if (nameFirst) {
    tree.children = tree.children || [];
    
    for (var i = 0; i < tree.children.length; i++) {
      if (tree.children[i].name === nameFirst) {
        child = tree.children[i];
        break;
      }
    }

    if (!child) {
      child = {
        name: nameFirst
      };
      tree.children.push(child);
    }

    if (nameList.length > 0) {
      addChild(child, nameList, path, node);
    }
    else {
      child.path = path;
      child.chars = node.total_number_of_characters;
      child.lines = node.total_number_of_lines;
    }
  }
  else {
    tree.name = nameFirst;
    tree.path = path;
    tree.chars = node.total_number_of_characters;
    tree.lines = node.total_number_of_lines;
  }
}
