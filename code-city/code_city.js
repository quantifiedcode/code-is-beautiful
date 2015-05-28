!function(){

    "use strict";

    var codeCity = {};

    var houseMargin = 2;
    var houseFloorHeight = 3;
    var cityWidth = 1000;
    var cityHeight = 1000;

    function treeize(list) {
      var tree = {};

      for (var path in list) {
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
          child.stats = node;
        }
      }
      else {
        tree.name = nameFirst;
        tree.path = path;
        tree.stats = node;
      }
    }

    function loadData(url) {
      var list = new Promise(function(resolve, reject) {
        d3.json(url, function(error, root) {
          if (error) {
            reject(new Error(error));
          }
          else {
            resolve(root.summary.python.code_patterns);
          }
        });
      });
      
      var layout = d3.layout.treemap()
        .size([cityWidth, cityHeight])
        .sticky(true)
        .round(true)
        .padding(4 * houseMargin)
        .value(houseArea);

      return list.then(function(list) {
        var tree = treeize(list);

        return layout.nodes(tree).filter(function(d) {
          return Math.min(d.dx, d.dy) > 2 * houseMargin;
        });
      });
    }

    function snapToGrid(grid, value) {
      return grid * Math.ceil(value / 5);
    }

    function houseHeight(d) {
      return d.children ? 1 : snapToGrid(5, d.stats.classes.total_cyclomatic_complexity);
    }

    var colorScale;

    function houseColor(d) {
      colorScale = colorScale || d3.scale.category20c();
      return colorScale(d.depth);
    }

    function houseArea(d) {
      return d.stats.classes.total_number_of_lines;
    }

    function initLegend(legendEl) {
      var legend = d3.select(legendEl);

      function legendMarkup(d) {
        var lines = d.stats.classes.total_number_of_lines;
        var cpx = d.stats.classes.total_cyclomatic_complexity;

        return "<p><b>" + (d.path || "/") + "</b></p>" +
          "<p>lines of code: " + lines + "</p>" +
          "<p>cyclomatic complexity: " + cpx + "</p>";
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

    function initChart(chartEl, legend, data) {
      var format = d3.format(",d");

        var svg = d3.select(chartEl).append("div")
            .style("position", "relative")
            .style("width", cityWidth + "px")
            .style("height", cityHeight + "px")
            .attr("class", "treemap");

        function position() {
          this.style("left", function(d) { return (d.x + houseMargin) + "px"; })
              .style("top", function(d) { return (d.y + houseMargin) + "px"; })
              .style("width", function(d) { return Math.max(0, d.dx - 2 * houseMargin) + "px"; })
              .style("height", function(d) { return Math.max(0, d.dy - 2 * houseMargin) + "px"; });
        }

        data.then(function(nodes) {
          var node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("div")
              .attr("class", "node")
              .attr("title", function(d) { return d.path; })
              .call(position)
              .style("background-color", houseColor);

          if (legend) {
            node.on("mouseover", legend.update)
              .on("mouseout", legend.remove);
          }
        });
    }

    function initScene(canvasEl, legend, data) {
      var canvas = d3.select(canvasEl);
      var mouse = new THREE.Vector2();
      var raycaster = new THREE.Raycaster();
      var scene = new THREE.Scene();
      var camera = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.1, 1000 );
      var renderer;
      var intersected;
      var rootHouse;

      function addHouse(d) {
        var unitHeight = 2 / 1000;
        var gw = Math.max(0, d.dx - 2 * houseMargin) / 500;
        var gh = Math.max(0, d.dy - 2 * houseMargin) / 500;
        var gd = unitHeight * houseHeight(d);

        var gx = (d.x + d.dx / 2) / 500 - 1;
        var gy = 1 - (d.y + d.dy / 2) / 500;
        var gz = d.depth * unitHeight + gd / 2;

        var geometry = new THREE.BoxGeometry(gw, gh, gd);
        var material = new THREE.MeshLambertMaterial({ color: houseColor(d) });
        var cube = new THREE.Mesh(geometry, material);

        cube.position.x = gx;
        cube.position.y = gy;
        cube.position.z = gz;

        cube.castShadow = true;
        cube.receiveShadow = true;

        cube.d = d;

        var objToAdd = rootHouse || scene;
        objToAdd.add(cube);

        if (!rootHouse) {
          rootHouse = cube;
          rootHouse.rotation.z = Math.PI / 4;
        }
      }

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

        mouse.x = ((e.offsetX - et.offsetLeft) / et.clientWidth) * 2 - 1;
        mouse.y = - ((e.offsetY - et.offsetTop) / et.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        var intersects = raycaster.intersectObjects(rootHouse ? [rootHouse].concat(rootHouse.children) : []);

        if (intersects.length > 0) {
          if (intersected != intersects[0].object) {
            if (intersected) {
              intersected.material.emissive.setHex(intersected.currentHex);
            }

            intersected = intersects[0].object;
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

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(cityWidth, cityHeight);
      renderer.setClearColor( 0xffffff, 1);
      renderer.shadowMapEnabled = true;

      canvas.node().appendChild(renderer.domElement);

      camera.position.y = -3;
      camera.position.z = 2;
      camera.lookAt(new THREE.Vector3(0, 0, 0));

      var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
      directionalLight.position.set(-5, -10, 15);
      directionalLight.castShadow = true;
      directionalLight.shadowCameraNear = 0.01;
      directionalLight.shadowCameraFar = 40;
      directionalLight.shadowCameraRight = 1.5;
      directionalLight.shadowCameraLeft = -1.5;
      directionalLight.shadowCameraTop  = 1.5;
      directionalLight.shadowCameraBottom = -1.5;
      directionalLight.shadowDarkness = 0.4;

      scene.add(directionalLight);

      // add subtle ambient lighting
      var ambientLight = new THREE.AmbientLight(0x313131);
      scene.add(ambientLight);

      renderer.domElement.addEventListener('mousemove', onCanvasMouseMove, false);

      data.then(function(nodes) {
        nodes.forEach(addHouse);
        render();
      });
      
      render();
      animate();
    }

    codeCity.initLegend = initLegend;
    codeCity.initChart = initChart;
    codeCity.initScene = initScene;
    codeCity.loadData = loadData;

    if (typeof define === "function" && define.amd) 
        define(codeCity); 
    else if (typeof module === "object" && module.exports)
        module.exports = codeCity;
    else
        window.codeCity = codeCity;

}();
