(
function(){

    function stackChartModule(d3)
    {

        function stack(element,data,params){

            while (element.hasChildNodes())
            {
                element.removeChild(element.firstChild);
            }

            var width = element.offsetWidth;
            var height = 250;
            if (params.height){
                if (params.heightType){
                    if (params.heightType == 'percent')
                        height = width*params.height/100.0;
                    else
                        height = params.height; //we assume absolute
                }
                else
                    height = params.height;//we assume absolute, again
            }
            var name_index = 0;
            var count_index = 1;
            var children_index = 3;
            
            var max_depth=3;
            
            var data_slices = [];
            var max_level = 2;

            var svg = d3.select(element).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                  
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

                var dataSlice = {
                                 start : start_deg,
                                 stop : stop_deg,
                                 name : name,
                                 level : level
                                };

                for(var key in nodeData)
                    dataSlice[key] = nodeData[key];

                data_slices.push(dataSlice);

                for (var childKey in nodeData.children)
                {
                    child = nodeData.children[childKey];
                    var value = child.value;
                    var color = child.color;
                    if (params.bounds === undefined){
                        if (minValue === undefined || color <= minValue)
                            minValue = color;
                        if (maxValue === undefined || color >= maxValue)
                            maxValue = color;
                    }
                    var inc_deg = (stop_deg-start_deg)/total*value;
                    var child_start_deg = current_deg;
                    current_deg+=inc_deg;
                    var child_stop_deg = current_deg;
                    var span_deg = child_stop_deg-child_start_deg;
                    processNodeData(child,childKey,level+1,child_start_deg,child_stop_deg);
                }
            }            
            processNodeData(data,"(all files)",0,0,1.0);

            var ref = data_slices[0];
            var next_ref = ref;
            var last_refs = [];

            var baseThickness = height/4;

            var thickness = function(level){return baseThickness/(Math.pow(Math.max(0,level-max_level),3.0)+1.0);};
            var y = function(level){var steps=10;return level+d3.sum(d3.range(0,steps),function(d){var inc = level*1.0/steps;var x = level*d/steps;return thickness(x)*inc;}) };

            var slices = svg.selectAll(".form")
                .data(function(d) { return data_slices; })
                .enter();

            var getWidth = function(d,ref){
                return width*(d.stop-d.start)/(ref.stop-ref.start);
            }

            var getStart = function(d,ref){
                return width*(d.start-ref.start)/(ref.stop-ref.start);
            }

            var getY = function(d,ref){
                return y(d.level-ref.level)+(d.level-ref.level)*1;
            }

            var getHeight = function(d,ref){
                return y(d.level+1-ref.level)-y(d.level-ref.level);
            }

            var isChild = function(b,d){
                if (b.start +precision >= d.start && b.stop-precision <= d.stop && b.level >= d.level)
                {
                    return true;
                }
                return false;
            }

            var getTextOpacity = function(d,ref,node){
                if ((isChild(d,ref) || d === ref) && getWidth(d,ref)  > node.getBBox().width+6
                                       && getHeight(d,ref) > node.getBBox().height+3 ){
                        return 1.0;
                }
                    return 0.0            
                }

            var makeRect = function(group){
                group.append("svg:rect")
                .attr("x",function(b){return getStart(b,ref);})
                .attr("y",function(b){return getY(b,ref);})
                .attr("width",function(b){return getWidth(b,ref);})
                .attr("height",function(b){return getHeight(b,ref);})
                .attr("id",function(d,i){return "chart"+i;})
                .style("fill", function(d) {return d.color;})
                .on("click",animate)
                .on("mousemove",function(d,e){
                    if(params.legend && params.legend.onMouseover)
                        params.legend.onMouseover(d,d3.event);
                })
                .on("mouseout",function(d,e){
                    if(params.legend && params.legend.onMouseout)
                        params.legend.onMouseout(d,d3.event);
                })
                .attr("class","form");

                group.append("svg:text")
                .attr("x",function(b){return getStart(b,ref)+5;})
                .attr("y",function(b){return getY(b,ref)+20;})
                .attr("text-anchor","left")
                .attr("dominant-baseline","before-edge")
                .attr("fill",function(d){return d.textColor || '#000000';})
                .attr("pointer-events",'none')
                .attr("opacity",0)
                .text(function(d) { return "  "+d.title; });


                return group;
            }.bind(this);
            
            makeRect(slices.append("g"))

            setTimeout(function(){
            svg.selectAll("text")
                .attr("opacity",function(b){return getTextOpacity(b,ref,this);})
            },100);


            var precision = 0.0001;
            var animating = false;
            function animate(d,e) {

                if (animating)
                    return;
                animating = true;
                setTimeout(function(){
                    animating = false;
                    if (params.legend && params.legend.onClick)
                        params.legend.onClick(d,d3.event);
                },500);
                var revert = false;

                var new_ref;

                if (d == ref && last_refs.length > 0)
                {
                    revert = true;
                    last_ref = last_refs.pop();
                }
                if (revert)
                {
                    new_ref = last_ref;
                    svg.selectAll("rect")
                    .filter(function(b){return isChild(b,new_ref)})
                    .transition().duration(500)
                    .style("opacity","1").attr("pointer-events","all");
                }
                else
                {
                    new_ref = d;
                    svg.selectAll("rect")
                   .filter(function(b){return !isChild(b,d)})
                    .transition().duration(500).style("opacity","0").attr("pointer-events","none");
                }

                svg.selectAll("rect")
                .filter(function(b){return isChild(b,d)})
                .transition().duration(500)
                .attr("x",function(b){return getStart(b,new_ref);})
                .attr("y",function(b){return getY(b,new_ref);})
                .attr("width",function(b){return getWidth(b,new_ref);})
                .attr("height",function(b){return getHeight(b,new_ref);})

                svg.selectAll("text")
                .filter(function(b){return isChild(b,d)})
                .transition().duration(500)
                .attr("x",function(b){return getStart(b,new_ref)+5;})
                .attr("y",function(b){return getY(b,new_ref)+20;})
                .attr("opacity",function(b){return getTextOpacity(b,new_ref,this);});

                svg.selectAll("text")
                .filter(function(b){return !isChild(b,d)})
                .transition().duration(500)
                .attr("opacity",function(b){return getTextOpacity(b,new_ref,this);});

                if (! revert)
                    last_refs.push(ref);
                ref = new_ref;

            };

        }
        return {stack: stack};
    }

    if (typeof define === "function" && define.amd){
        define(["d3"],stackChartModule);
    }
    else if (typeof module === "object" && module.exports)
        module.exports = stackChartModule(require('d3'));
    else
        window.stackChart = stackChartModule(d3);

}())
