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

                var desiredLeft = (e.offsetX-et.offsetLeft/2);
                var desiredTop = (e.offsetY-et.offsetTop);

                var style = {position:"absolute",
                             left:desiredLeft+"px",
                             top:desiredTop+"px"};

                var info = legendContent(d,e);

                legendDiv.innerHTML = "<div class=\"popover top show\"> \
                  <div class=\"arrow\"></div> \
                  <h3 class=\"popover-title\">"+legendTitle(d,e)+"</h3> \
                  <div class=\"popover-content\"> \
                    "+info+"\
                  </div> \
                </div>";
            }

            legendDiv.children[0].style.left = Math.ceil(desiredLeft-legendDiv.children[0].clientWidth/2.0)+"px";
            legendDiv.children[0].style.top = (desiredTop-legendDiv.children[0].clientHeight-10)+"px";

          }.bind(this)
        };
    }
});