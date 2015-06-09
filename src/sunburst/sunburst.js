(
function(){

    function sunburstModule(d3)
    {

        function sunburst(element,data,params)
        {

            while (element.hasChildNodes())
            {
                element.removeChild(element.firstChild);
            }

            var width = element.offsetWidth;
            var height = width;
            var name_index = 0;
            var count_index = 1;
            var children_index = 3;

            var max_depth=3;
            
            var data_slices = [];
            var max_level = 3;

            var svg = d3.select(element).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");
                  
            var minValue = undefined,maxValue = undefined;

            if (params.bounds !== undefined){
                minValue = d3.min(params.bounds);
                maxValue = d3.max(params.bounds);
            }

            function processNodeData(nodeData,name,level,start_deg,stop_deg)
            {
                var total = nodeData.value;
                var children = nodeData.children;
                var current_deg = start_deg;

                if (start_deg == stop_deg)
                    return;
                var dataSlice = {start : start_deg,stop : stop_deg,name : name,level : level};
                for(var key in nodeData)
                    dataSlice[key] = nodeData[key];
                data_slices.push(dataSlice);

                for (var childKey in nodeData.children)
                {
                    child = nodeData.children[childKey];
                    var value = child.value;
                    var inc_deg = (stop_deg-start_deg)/total*value;
                    var child_start_deg = current_deg;
                    current_deg+=inc_deg;
                    var child_stop_deg = current_deg;
                    var span_deg = child_stop_deg-child_start_deg;
                    processNodeData(child,childKey,level+1,child_start_deg,child_stop_deg);
                }
            }            
            processNodeData(data,"",0,0,2.0*Math.PI);

            var ref = data_slices[0];
            var next_ref = ref;
            var last_refs = [];

            var baseThickness = width/10.0;

            var thickness = function(level){return baseThickness/(Math.pow(Math.max(0,level-max_level),1.0)+1.0);};
            var radius = function(level){var steps=10;return d3.sum(d3.range(0,steps),function(d){var inc = level*1.0/steps;var x = level*d/steps;return thickness(x)*inc;}) };
                
            var arc = d3.svg.arc()
            .startAngle(function(d) {if(d.level==0){return d.start;}return d.start; })
            .endAngle(function(d) { if(d.level==0){return d.stop;}return d.stop+(d.stop-0.005 > d.start+0.005 ? -0.005 :0); })
            .innerRadius(function(d) {return radius(d.level)+2})
            .outerRadius(function(d) {return radius(d.level+1)});

            var slices = svg.selectAll(".form")
                .data(function(d) { return data_slices; })
                .enter()
                .append("g");
                slices.append("path")
                .attr("d", arc)
                .attr("id",function(d,i){return "chart"+i;})
                .style("fill", function(d) { return d.color;})
                .on("click",animate)
                .on("mousemove",function(d,e){
                    if(params.legend && params.legend.onMouseover)
                        params.legend.onMouseover(d,d3.event);
                })
                .on("mouseout",function(d,e){
                    if(params.legend && params.legend.onMouseout)
                        params.legend.onMouseout(d,d3.event);
                })
                .attr("class","form")

            function getStartAngle(d,ref)
            {
                if (ref)
                {
                    var ref_span = ref.stop-ref.start;
                    return (d.start-ref.start)/ref_span*Math.PI*2.0
                }
                else
                {
                    return d.start;
                }
            }
            
            function getStopAngle(d,ref)
            {
                if (ref)
                {
                    var ref_span = ref.stop-ref.start;
                    return (d.stop-ref.start)/ref_span*Math.PI*2.0
                }
                else
                {
                    return d.start;
                }
            }
            
            function getLevel(d,ref)
            {
                if (ref)
                {
                    return d.level-ref.level;
                }
                else
                {
                    return d.level;
                }
            }
            
            function rebaseTween(new_ref)
            {
                return function(d)
                {
                    var level = d3.interpolate(getLevel(d,ref),getLevel(d,new_ref));
                    var start_deg = d3.interpolate(getStartAngle(d,ref),getStartAngle(d,new_ref));
                    var stop_deg = d3.interpolate(getStopAngle(d,ref),getStopAngle(d,new_ref));
                    var opacity = d3.interpolate(100,0);
                    return function(t)
                    {
                        return arc({start : start_deg(t),stop : stop_deg(t), level : level(t)});
                    }
                }
            }
            
            var animating = false;
            var precision = 0.001;

            function animate(d) {
                if (animating)
                    return;

                animating = true;
                var revert = false;

                var new_ref;
                if (d == ref && last_refs.length > 0)
                {
                    revert = true;
                    last_ref = last_refs.pop();
                }
                if (revert)
                {
                    d = last_ref;
                    new_ref = ref;
                    svg.selectAll(".form")
                    .filter(
                        function (b)
                        {
                            if (b.start+precision >= last_ref.start && b.stop-precision <= last_ref.stop  && b.level >= last_ref.level)
                            {
                                return true;
                            }
                            return false;
                        }
                    )
                    .transition().duration(500).style("opacity","1").attr("pointer-events","all");
                }
                else
                {
                    new_ref = d;
                    svg.selectAll(".form")
                    .filter(
                        function (b)
                        {
                            if (b.start-precision <= d.start || b.stop+precision >= d.stop || b.level < d.level)
                            {
                                return true;
                            }
                            return false;
                        }
                    )
                    .transition().duration(500).style("opacity","0").attr("pointer-events","none");
                }
                svg.selectAll(".form")
                .filter(
                    function (b)
                    {
                        if (b.start +precision >= new_ref.start && b.stop-precision <= new_ref.stop && b.level >= new_ref.level)
                        {
                            return true;
                        }
                        return false;
                    }
                )
                .transition().duration(500).attrTween("d",rebaseTween(d));

                setTimeout(function(){
                    animating = false;
                    if (! revert)
                    {
                        last_refs.push(ref);
                        ref = d;
                    }
                    else
                    {
                        ref = d;
                    }

                    if (params.legend && params.legend.onClick)
                        params.legend.onClick(d);

                    },500);

            }

        }

        return {sunburst: sunburst};
    }

    if (typeof define === "function" && define.amd){
        define(["d3"],sunburstModule);
    }
    else if (typeof module === "object" && module.exports)
        module.exports = sunburstModule(require('d3'));
    else
        window.sunburst = sunburstModule(d3);

}())
