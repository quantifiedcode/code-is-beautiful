var require ={
  paths: {
    "d3" : "bower_components/d3/d3",
    "threejs" : "bower_components/threejs/build/three.min",
    "jquery" : "bower_components/jquery/dist/jquery.min",
  },
  shim : {
    "d3" : {
        exports : "d3"
    },
    "threejs" : {
        exports : "THREE"
    }
  },
baseUrl : "../",
urlArgs: "bust=" + (new Date()).getTime()
};