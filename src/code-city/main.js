define([
  'code-city/code-city',
  'jquery',
  'common/legend',
  'data/loaders',
  'data/helpers'
],function(
  codeCity,
  $,
  legend,
  dataLoaders,
  dataHelpers
) {
    var data = dataLoaders.complexityExample('django');

    var metric = 'functions';

    var legendDiv = $('#code-city-legend')[0];
    var canvasDiv = $('#code-city-canvas')[0];

    var rotateLeftSpan = $('#rotate-left');
    var rotateRightSpan = $('#rotate-right');

    var nodeColorScale = ['#a50026',
                          '#d73027',
                          '#f46d43',
                          '#fdae61',
                          '#fee08b',
                          '#d9ef8b',
                          '#a6d96a',
                          '#66bd63',
                          '#1a9850',
                          '#006837'].reverse()


    function legendTitle(d,e){
        return d.path;
    }

    function legendContent(d,e){
        return "<div> \
            <table class=\"table table-striped\"> \
                <tbody> \
                    <tr> \
                        <td>lines of code</td> \
                        <td>"+d.data.metrics.total_number_of_lines+"</td> \
                    </tr> \
                    <tr> \
                        <td>total complexity</td> \
                        <td>"+d.data.code_patterns[metric].total_cyclomatic_complexity+"</td> \
                    </tr> \
                    <tr> \
                        <td>complexity / 100 lines of code</td> \
                        <td>"+Math.ceil(d.data.code_patterns[metric].total_cyclomatic_complexity/d.data.metrics.total_number_of_lines*100)+"</td> \
                    </tr> \
                </tbody> \
            </table> \
        </div>";
    }


    function nodeHeight(d) {
        function snapToGrid(grid, value) {
          return grid * Math.ceil(value / grid);
        }
        if (d.children && d.children.length)
            return 0;
        return snapToGrid(5, d.data.code_patterns[metric].total_cyclomatic_complexity);
    }

    function nodeColor(d) {
      return d.data.code_patterns[metric].total_cyclomatic_complexity/d.data.metrics.total_number_of_lines;
    }

    function nodeArea(d) {
      return d.data.metrics.total_number_of_lines;
    }

    var graphParams = {
        legend: legend(legendDiv,legendTitle,legendContent)
    };

    var mapperParams = {
        mappers: {
            height: nodeHeight,
            area: nodeArea,
            colorValue: nodeColor,
            title: function(d){return d.key.split('/').slice(-1)[0];},
            path: function(d){return d.key || '(all files)';}
        },
        split: function(key){return key.split('/')
    }};

    data.then(function(d){
        var mergedData = {};
        for(var key in d.python.code_patterns){
            mergedData[key] = {metrics : d.python.metrics[key],code_patterns : d.python.code_patterns[key]};
        }
        var treeData = dataHelpers.convertToTree(mergedData,mapperParams);
        //we add color to the elements (using the min/max information)
        dataHelpers.colorize(treeData,'colorValue',nodeColorScale,{min: 0,max : 0.4});

        var codeCityChart;
        try{
            codeCityChart = codeCity.codeCity($('#code-city-chart')[0], treeData, graphParams);
        }catch(e){
            if (e instanceof TypeError)
                $('#code-city-chart').html("\
                \
                <div> \
                <img src=\"../assets/images/code_city_large.png\" width=\"100%\"> \
                <p style=\"background:rgba(255,0,0,0.7); top:300px; position:absolute; font-size:18px;\" class=\"alert alert-danger\"> \
                    It seems that your browser does not support (or has deactivated) WebGL, which is required for this graph. Please upgrade your browser or make sure that WebGL is activated. Below is a teaser of what the visualization of your project might look like. \
                </p> \
                </div> \
                ");
        }

        var isRotating = false;

        var startRotate = function(left){
            if (isRotating)
                return;
            isRotating = false;
            var rotate = function(){
                if (!isRotating)
                    return;
                codeCityChart.setCameraRotation(codeCityChart.getCameraRotation()+(left ? 0.01 : -0.01));
                setTimeout(rotate,10);
            }
            var startRotation = function(){
                isRotating = true;
                rotate();
            }
            setTimeout(startRotation,40);
        };

        var stopRotate = function(){
            isRotating = false;
        }

        rotateLeftSpan.mouseover(startRotate.bind(null,false));
        rotateRightSpan.mouseover(startRotate.bind(null,true));
        rotateLeftSpan.mouseout(stopRotate);
        rotateRightSpan.mouseout(stopRotate);
    });
});
