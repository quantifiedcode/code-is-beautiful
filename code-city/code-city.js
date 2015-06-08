(
function(){

    function codeCityModule(THREE,d3)
    {

        'use'+' strict';

        var houseMargin = 0.005; //min margin in percent
        var houseFloorHeight = 3;

        var exports = {};

        function initChart(chartEl, legend, data){
          var format = d3.format(",d");

          var canvas = d3.select(chartEl);
          var width = canvas.node().offsetWidth;
          var height = width;

            var svg = canvas.append("div")
                .style("position", "relative")
                .style("width", width + "px")
                .style("height", height + "px")
                .attr("class", "treemap");

            function position() {
              this.style("left", function(d) {return Math.ceil((d.x + houseMargin)*width) + "px"; })
                  .style("top", function(d) {return Math.ceil((d.y + houseMargin)*height) + "px"; })
                  .style("width", function(d) {return Math.max(0, Math.ceil((d.dx - 2 * houseMargin)*width)) + "px"; })
                  .style("height", function(d) {return Math.max(0, Math.ceil((d.dy - 2 * houseMargin)*height)) + "px"; });
            }

            var node = svg.selectAll(".node")
              .data(data)
              .enter().append("div")
                .attr("class", "node")
                .attr("title", function(d) { return d.path; })
                .call(position)
                .style("background-color", function(d){d.color});
             if (legend) {
               node.on("mouseover", legend.update)
               .on("mouseout", legend.remove);
            }
        }


        function generateTreemap(data,params){
          
          var layout = d3.layout.treemap()
            .size([1.0, 1.0])
            .sticky(true)
            .round(false)
            .padding(4 * houseMargin)
            .value(function(d){return d.area;});

          return layout.nodes(data).filter(function(d){
            return Math.min(d.dx, d.dy) > 2 * houseMargin;
          });
        }

        function codeCity(element, rawData, params){

          var canvas = d3.select(element);

          var data = generateTreemap(rawData,params);

          var width = canvas.node().offsetWidth;
          var height = width;

          var raycaster = new THREE.Raycaster();
          var scene = new THREE.Scene();
          var camera = new THREE.OrthographicCamera(-1.5, 1.5, 1.2, -1.2, 0.2, 1000 );
          var renderer;
          var intersected;
          var rootHouse;

          function addHouse(d){
            var unitHeight = 3 / 1000;
            var w = 1000;
            var h = 1000;
            var gw = Math.max(0, (d.dx - 2 * houseMargin)*w) / 500;
            var gh = Math.max(0, (d.dy - 2 * houseMargin)*h) / 500;
            var gd = unitHeight * (d.children ? 1 : d.height);

            var gx = ((d.x + d.dx/2)*w ) / 500 - 1;
            var gy = 1 - ((d.y + d.dy/2)*h ) / 500;
            var gz = d.depth * unitHeight + gd / 2;

            var geometry = new THREE.BoxGeometry(gw, gh, gd);
            var material = new THREE.MeshLambertMaterial({ color: d.color });
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

          var selectedD;

          function onCanvasMouseMove(event) {
            var e = event;
            var et = e.target;

            e.preventDefault();

            var mouse = new THREE.Vector2();

            mouse.x = ((e.offsetX - et.offsetLeft) / et.clientWidth) * 2 - 1;
            mouse.y = -((e.offsetY - et.offsetTop) / et.clientHeight) * 2 + 1;
            mouse.z = -1;

            raycaster.setFromCamera(mouse, camera);

            var intersects = raycaster.intersectObjects(rootHouse ? [rootHouse].concat(rootHouse.children) : []);

            if (intersects.length > 0) {
              if (intersected != intersects[0].object || true) {
                if (intersected) {
                  intersected.material.emissive.setHex(intersected.currentHex);
                }

                intersected = intersects[0].object;
                intersected.currentHex = intersected.material.emissive.getHex();
                intersected.material.emissive.setHex( 0xff0000 );

                selectedD = intersected.d;
                if (params.legend){
                    params.legend.onMouseover(intersected.d,e);
                }
                render();
              }
            }
            else if (intersected) {
              intersected.material.emissive.setHex(intersected.currentHex);
              intersected = null;

              if (params.legend && selectedD)
                  params.legend.onMouseout(selectedD,e);

              selectedD = undefined;

              render();
            }
          }

          function onCanvasMouseClick(e){
            e.preventDefault();
            if (params.legend)
                params.legend.onClick(selectedD,e);
          }

          renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
          renderer.setSize(width, height);
          renderer.setClearColor( 0xffffff, 1);
          renderer.shadowMapEnabled = true;

          canvas.node().appendChild(renderer.domElement);

          camera.position.y = -3;
          camera.position.z = 2;
          camera.lookAt(new THREE.Vector3(0, -0.25, 0));

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
          renderer.domElement.addEventListener('click', onCanvasMouseClick, false);

          data.forEach(addHouse);

          render();
          animate();
        }

        exports.initChart = initChart;
        exports.codeCity = codeCity;
        exports.generateTreemap = generateTreemap;

        return exports;

    }

    if (typeof define === "function" && define.amd){
        define(["threejs","d3"],codeCityModule);
    }
    else if (typeof module === "object" && module.exports)
        module.exports = codeCityModule(require('d3'),require('threejs'));
    else
        window.codeCity = codeCityModule(d3,THREE);

}())
