define(['code-city/code-city',
        'jquery',
        'common/legend',
        'data/loaders',
        'data/helpers'],function(codeCity,$,legend,dataLoaders,dataHelpers)
{
    var data = dataLoaders.complexityExample();

    var metric = 'functions';

    var legendDiv = $('#code-city-legend')[0];
    var canvasDiv = $('#code-city-canvas')[0];

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
                        <td>"+d.data[metric].total_number_of_lines+"</td> \
                    </tr> \
                    <tr> \
                        <td>total complexity</td> \
                        <td>"+d.data[metric].total_cyclomatic_complexity+"</td> \
                    </tr> \
                    <tr> \
                        <td>complexity / 100 lines of code</td> \
                        <td>"+Math.ceil(d.data[metric].total_cyclomatic_complexity/d.data[metric].total_number_of_lines*100)+"</td> \
                    </tr> \
                </tbody> \
            </table> \
        </div>";
    }


    function nodeHeight(d) {
        function snapToGrid(grid, value) {
          return grid * Math.ceil(value / 5);
        }
        return snapToGrid(5, d.data[metric].total_cyclomatic_complexity);
    }

    function nodeColor(d) {
      return d.data[metric].total_cyclomatic_complexity/d.data[metric].total_number_of_lines;
    }

    function nodeArea(d) {
      return d.data[metric].total_number_of_lines;
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
            path: function(d){return d.key;}
        },
        split: function(key){return key.split('/')
    }};

    data.then(
        function(d){
            var treeData = dataHelpers.convertToTree(d,mapperParams);
            //we add color to the elements (using the min/max information)
            dataHelpers.colorize(treeData,'colorValue',nodeColorScale);

            codeCity.codeCity($('#code-city-chart')[0], treeData, graphParams);
        });

});