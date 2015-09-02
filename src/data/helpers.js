define([],function(){
    function convertToTree(data,params) {
        var minValue,maxValue;

        var min = {};
        var max = {};

        function recursivelyAddNode(node, keyComponents,key, data) {
          node.children = node.children || [];

          if (keyComponents.length && keyComponents[0]){
            var keyComponent = keyComponents.shift();
            var child;

            for (var i=0; i<node.children.length; i++){
              if (node.children[i].name === keyComponent){
                child = node.children[i];
                break;
              }
            }

            if (!child){
              child = {
                name: keyComponent
              };
              node.children.push(child);
            }
            recursivelyAddNode(child,keyComponents,key,data);
          }
          else{
            node.key = key;
            node.data = data;
            if (params.mappers){
                for(var mapper in params.mappers){
                    node[mapper] = params.mappers[mapper](node);
                    if (min[mapper] === undefined || (min[mapper] > node[mapper]))
                        min[mapper] = node[mapper];
                    if (max[mapper] === undefined || (max[mapper] < node[mapper]))
                        max[mapper] = node[mapper];
                }
            }
          }
        }

      var tree = {};

      for (var key in data)
          recursivelyAddNode(tree,params.split(key),key,data[key]);

      tree.minima = min;
      tree.maxima = max;

      return tree;
    }

    function loadJson(url) {
      var data = new Promise(function(resolve, reject) {
        d3.json(url, function(error, root) {
          if (error) {
            reject(new Error(error));
          }
          else {
            resolve(root.summary);
          }
        });
      });

      return data;
    }

    function colorize(tree,key,colors,params){

      var params = params || {};

      var minValue = params.min || tree.minima[key],
          maxValue = params.max || tree.maxima[key]

      var colorScale = d3.scale.linear()
                         .domain(d3.range(minValue,maxValue,(maxValue-minValue)/colors.length))
                         .range(colors);

      var applyColorScale = function(node){
        node.color = colorScale(Math.max(minValue,Math.min(node[key],maxValue)));
        for(var i in node.children)
            applyColorScale(node.children[i]);
      };

      applyColorScale(tree);
      return tree;
    }

    return {
        convertToTree: convertToTree,
        loadJson : loadJson,
        colorize: colorize
    }
});
