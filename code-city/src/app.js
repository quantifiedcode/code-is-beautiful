function legend_function(d) {
    return "<h2>" + (d.path || "/") + "</h2><p>" + d.lines + " lines of code.</p>"
}

function initChart(chartEl, legendEl, scene) {
    var diameter = 1000,
        format = d3.format(",d"),
        color = d3.scale.category20c();

    var bubble = d3.layout.pack()
        .sort(null)
        .size([diameter, diameter])
        .value(function(d) { return d.lines; })
        .padding(1.5);

    var svg = d3.select(chartEl).append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");

    d3.json("metrics.json", function(error, root) {
      	var list = root.summary.python.metrics;
      	var tree = treeize(list, 1);
        var nodes = bubble.nodes(tree);
        var node = svg.selectAll(".node")
          .data(nodes)
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            .each(function(d) { scene.addHouse(d.x, d.y, d.r, d.depth, color(d.depth)); });

        node.append("title")
            .text(function(d) { return d.path + ": " + format(d.lines); });

        node.append("circle")
            .attr("r", function(d) { return d.r; })
            .style("fill", function(d) { return color(d.depth); });

        if (legendEl) {
            node.on("mouseover",update_legend)
                .on("mouseout",remove_legend);
  
            var legend = d3.select(legendEl);

            function update_legend(d) {
                legend.html(legend_function(d));
                legend.transition().duration(200).style("opacity","1");
            }

            function remove_legend(d) {
                legend.transition().duration(1000).style("opacity","0");
            }
        }
        
        scene.render();
    });
}

function addHouse(scene, x, y, r, level, color) {
  console.log('adding house', x, y, r, level);
  var geometry = new THREE.CylinderGeometry( r / 500, r / 500, 0.1, 64 );
  var material = new THREE.MeshLambertMaterial( { color: color } );
  var cube = new THREE.Mesh( geometry, material );
  
  cube.rotation.x = 1.57;
  cube.position.x = x / 500 - 1;
  cube.position.y = y / 500 - 1;
  cube.position.z = level * 0.1;
  
  cube.castShadow = true;

  scene.add( cube );
}

function initScene(canvasEl) {
  var canvas = d3.select(canvasEl);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 45, 1, 0.1, 1000 );

  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize( 1000, 1000 );
  renderer.setClearColor( 0xffffff, 1);
  canvas.node().appendChild(renderer.domElement);

  camera.position.y = -2;
  camera.position.z = 2;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
  directionalLight.position.set(-10, -20, 40);
  scene.add(directionalLight);
  
  // add subtle ambient lighting
  var ambientLight = new THREE.AmbientLight(0x313131);
  scene.add(ambientLight);
    
  return {
    addHouse: function(x, y, r, level, color) {
      var geometry = new THREE.CylinderGeometry( r / 500, r / 500, 0.1, 64 );
      var material = new THREE.MeshLambertMaterial( { color: color } );
      var cube = new THREE.Mesh( geometry, material );
  
      cube.rotation.x = 1.57;
      cube.position.x = x / 500 - 1;
      cube.position.y = y / 500 - 1;
      cube.position.z = level * 0.1;
  
      cube.castShadow = true;

      scene.add( cube );
    },
    
    render: function() {
      renderer.render( scene, camera );

      function animate() {
      	requestAnimationFrame(animate);    
      }

      animate();
    }
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
      child.lines = node.total_number_of_lines;
    }
  }
  else {
    tree.name = nameFirst;
    tree.path = path;
    tree.lines = node.total_number_of_lines;
  }
}
