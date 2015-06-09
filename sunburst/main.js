define(['sunburst/sunburst',
        'jquery',
        'common/legend',
        'data/loaders',
        'data/helpers'],function(sunburst,$,legend,dataLoaders,dataHelpers)
{
    var data = dataLoaders.complexityExample('django');

    var metric = 'functions';

    var legendDiv = $('#sunburst-legend')[0];
    var canvasDiv = $('#sunburst-canvas')[0];

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

    function nodeColor(d) {
      return d.data.code_patterns[metric].total_cyclomatic_complexity/d.data.metrics.total_number_of_lines;
    }

    function nodeValue(d) {
      return d.data.metrics.total_number_of_lines;
    }


    var graphParams = {
        legend: legend(legendDiv,legendTitle,legendContent)
    };

    var mapperParams = {
        mappers: {
            value: nodeValue,
            colorValue: nodeColor,
            title: function(d){return d.key.split('/').slice(-1)[0] || '(all files)';},
            path: function(d){return d.key || '(all files)';}
        },
        split: function(key){return key.split('/')
    }};

    data.then(
        function(d){
            var mergedData = {};
            for(var key in d.python.code_patterns){
                mergedData[key] = {metrics : d.python.metrics[key],code_patterns : d.python.code_patterns[key]};
            }
            var treeData = dataHelpers.convertToTree(mergedData,mapperParams);
            //we add color to the elements (using the min/max information)
            dataHelpers.colorize(treeData,'colorValue',nodeColorScale,{min: 0,max: 0.3});
            sunburst.sunburst($('#sunburst')[0], treeData, graphParams);
        });

});