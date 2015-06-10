define([],function(){
    return function(legendDiv,legendTitle,legendContent)
    {
        return {
          onClick : function(d,e){
            //nothing...
          }.bind(this),

          onMouseout: function(d,e){
            legendDiv.innerHTML = '';
          }.bind(this),

          onMouseover: function(d,e) {

            var et = e.target;
            if (d && e){

                var desiredLeft = ((e.offsetX !== undefined ? e.offsetX : e.layerX)-legendDiv.offsetLeft);
                var desiredTop = ((e.offsetY !== undefined ? e.offsetY : e.layerY) -legendDiv.offsetTop);

                var style = {
                             left:desiredLeft+"px",
                             top:desiredTop+"px"
                            };

                var info = legendContent(d,e);

                legendDiv.innerHTML = "<div style=\"pointer-events:none; position:absolute;\" class=\"popover top show\"> \
                  <div class=\"arrow\"></div> \
                  <h3 class=\"popover-title\">"+legendTitle(d,e)+"</h3> \
                  <div class=\"popover-content\"> \
                    "+info+"\
                  </div> \
                </div>";

                var legend = legendDiv.children[0];

                for(var key in style)
                    legendDiv.style[key] == style[key];

                legend.style.left = Math.ceil(desiredLeft-legend.clientWidth/2.0)+"px";
                legend.style.top = (desiredTop-legend.clientHeight)+"px";

            }


          }.bind(this)
        };
    }
});