(function(){
    function codeCityModule(THREE,d3) {
        'use strict';

        var houseMargin = 0.005; //min margin in percent
        var houseFloorHeight = 3;

        var exports = {};

        function generateTreemap(data,params){
          var layout = d3.layout.treemap()
            .size([1.0, 1.0])
            .sticky(true)
            .round(false)
            .padding(4 * houseMargin)
            .value(function(d){return d.area;});

          return layout.nodes(data).filter(function(d){
            return Math.min(d.dx, d.dy) > 0.001 * houseMargin;
          });
        }

        function codeCity(element, rawData, params){
          var canvas = d3.select(element);

          var data = generateTreemap(rawData,params);

          var width = canvas.node().offsetWidth;
          var height = width;

          var raycaster = new THREE.Raycaster();
          var scene = new THREE.Scene();
          var camera = new THREE.PerspectiveCamera(45.0, width/height, 1.0, 1000 );

          if (!window.renderer)
            window.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
          var renderer = window.renderer;

          camera.position.y = -3;
          camera.position.z = 2;
          camera.lookAt(new THREE.Vector3(0, -0.25, 0));

          var renderer;
          var intersected;
          var rootHouse;

          var fragmentShader = " \
varying vec2 vUv; \
varying vec3 vColor; \
varying vec3 pos; \
uniform float glow; \
void main() { \
    float m = 0.8+pos.z*1.0; \
    float d1 = abs(vUv.x-1.0); \
    float d2 = vUv.x; \
    float d3 = abs(vUv.y-1.0); \
    float d4 = vUv.y; \
    float minDistance = min(min(min(d1,d2),d3),d4); \
    float dEdge = 1.0; \
    float treshold = 0.12; \
    float multiplier = 1.05; \
    if (minDistance < treshold) \
        dEdge = multiplier/(1.0+pow(minDistance/treshold+0.01,2.0)*(multiplier-1.0)); \
    m = dEdge*m; \
    m = m*glow; \
    float dPersp = sqrt(pow(vUv.x-1.0,2.0)+pow(vUv.y-1.0,2.0)); \
    m = (1.0+dPersp*0.2)*m; \
    gl_FragColor = vec4(vColor.x*m, vColor.y*m,vColor.z*m ,1.0); \
}";
          var vertexShader = " \
uniform float glow; \
uniform vec3 color; \
varying vec3 vColor; \
varying vec2 vUv; \
varying vec3 pos; \
void main() { \
    vUv = uv; \
    vColor = color; \
    gl_Position = projectionMatrix * \
                  modelViewMatrix * vec4(position, 1.0 ); \
    pos = position; \
} \
";

          var cameraDistance = 3.0;
          var cameraHeight = 1.95;
          var cameraZ = -1.4;
          var cameraAngle = 0.0;
          var maximumHeight;
          var minimumHeight;

          function addHouse(d){
            var unitHeight = 5 / 1000;
            var w = 1000;
            var h = 1000;
            var gw = Math.max(0, (d.dx - 2 * houseMargin)*w) / 500;
            var gh = Math.max(0, (d.dy - 2 * houseMargin)*h) / 500;
            var baseHeight = Math.sqrt((d.height-minimumHeight)/(maximumHeight-minimumHeight));
            var gd = unitHeight * (d.children ? 0.05 : baseHeight)*130.0;

            var gx = ((d.x + d.dx/2)*w ) / 500 - 1;
            var gy = 1 - ((d.y + d.dy/2)*h ) / 500;
            var gz = d.depth * unitHeight + gd / 2;

            var shaderMaterial = new THREE.ShaderMaterial({
                fragmentShader: fragmentShader,
                vertexShader: vertexShader,
                uniforms : {
                    color : {type : 'c',value: new THREE.Color(d.color)},
                    glow : {type: 'f',value : 1.0},
                }
            });


            var geometry = new THREE.BoxGeometry(gw, gh, gd);
            var material = new THREE.MeshLambertMaterial({ color: d.color });
            var cube = new THREE.Mesh(geometry, shaderMaterial);

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

            mouse.x = (((e.offsetX !== undefined ? e.offsetX : e.layerX) - et.offsetLeft) / et.clientWidth) * 2 - 1;
            mouse.y = -((( e.offsetY !== undefined ? e.offsetY : e.layerY) - et.offsetTop) / et.clientHeight) * 2 + 1;
            mouse.z = -1;

            raycaster.setFromCamera(mouse, camera);

            var intersects = raycaster.intersectObjects(rootHouse ? [rootHouse].concat(rootHouse.children) : []);

            if (intersects.length > 0) {
              if (intersected != intersects[0].object || true) {
                if (intersected) {
                  intersected.material.uniforms.glow = {type : 'f',value : 1.0};
                  intersected.material.needsUpdate = true;
                }

                intersected = intersects[0].object;
                intersected.material.uniforms.glow = {type : 'f',value : 1.4};
                intersected.material.needsUpdate = true;

                selectedD = intersected.d;
                if (params.legend){
                    params.legend.onMouseover(intersected.d,e);
                }
                render();
              }
            } else if (intersected) {
                intersected.material.uniforms.glow = {type : 'f',value : 1.0};
                intersected.material.needsUpdate = true;
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

          renderer.setSize(width, height);
          renderer.setClearColor( 0xffffff, 1);
          renderer.shadowMapEnabled = true;

          canvas.node().appendChild(renderer.domElement);

          var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
          directionalLight.position.set(-5, -10, 15);
          directionalLight.castShadow = true;
          directionalLight.shadowCameraNear = 0.01;
          directionalLight.shadowCameraFar = 20;
          directionalLight.shadowCameraRight = 1.5;
          directionalLight.shadowCameraLeft = -1.5;
          directionalLight.shadowCameraTop  = 1.5;
          directionalLight.shadowCameraBottom = -1.5;
          directionalLight.shadowDarkness = 0.5;

          scene.add(directionalLight);

          // add subtle ambient lighting
          var ambientLight = new THREE.AmbientLight(0x313131);
          scene.add(ambientLight);

          renderer.domElement.addEventListener('mousemove', onCanvasMouseMove, false);
          renderer.domElement.addEventListener('click', onCanvasMouseClick, false);

          var findExtremes = function(d){
            if (d.children)
                return;
            if (d.height > maximumHeight || maximumHeight === undefined)
                maximumHeight = d.height;
            if (d.height < minimumHeight || minimumHeight === undefined)
                minimumHeight = d.height;
          }

          data.forEach(findExtremes);

          data.forEach(addHouse);

          render();
          animate();

          var distance = 500.0;
          var maxHeight = -20.0;
          var maxDistance = distance;
          var distanceAngle = 10.0;

          var flyBy = function(){
              var acceleration = Math.pow((maxDistance-distance)/maxDistance,2.0);
              distance -= 0.01+32.0*(1.0-acceleration);
              var height = distance/maxDistance*maxHeight;
              distanceAngle=distance*0.1;

              camera.position.set(-(distance+cameraDistance)*Math.cos(distanceAngle+cameraAngle),-(distance+cameraDistance)*Math.sin(distanceAngle+cameraAngle),height+cameraHeight);
              camera.up = new THREE.Vector3(0,0,1);
              camera.lookAt(new THREE.Vector3(Math.cos(cameraAngle+distanceAngle),Math.sin(cameraAngle+distanceAngle),cameraZ));

              render();
              if (distance > 0)
                setTimeout(flyBy,10);
          };

          flyBy();

          var setCameraRotation = function(angle){
              cameraAngle = angle;
              camera.position.set(-cameraDistance*Math.cos(cameraAngle),-cameraDistance*Math.sin(cameraAngle),cameraHeight);
              camera.up = new THREE.Vector3(0,0,1);
              camera.lookAt(new THREE.Vector3(Math.cos(cameraAngle),Math.sin(cameraAngle),cameraZ));
              render();
          }

          var getCameraRotation = function(){
            return cameraAngle;
          }

          return {
            getCameraRotation : getCameraRotation,
            setCameraRotation : setCameraRotation
          };
        }

        exports.codeCity = codeCity;
        exports.generateTreemap = generateTreemap;

        return exports;
    }

    if (typeof define === "function" && define.amd){
        define(["threejs","d3"],codeCityModule);
    } else if (typeof module === "object" && module.exports){
        module.exports = codeCityModule(require('d3'),require('threejs'));
    } else {
        window.codeCity = codeCityModule(d3,THREE);
    }
}())
