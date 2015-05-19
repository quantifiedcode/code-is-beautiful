function legend_function(d) {
    return "<h2>" + (d.path || "/") + "</h2><p>" + d.value + " lines of code.</p>"
}

function initChart(chartEl, legendEl) {
    var diameter = 800,
        format = d3.format(",d"),
        color = d3.scale.category20c();

    var bubble = d3.layout.pack()
        .sort(null)
        .size([diameter, diameter])
        .padding(1.5);

    var svg = d3.select(chartEl).append("svg")
        .attr("width", diameter)
        .attr("height", diameter)
        .attr("class", "bubble");

    d3.json("metrics.json", function(error, root) {
      	var list = root.summary.python.metrics;
      	var tree = treeize(list);
        var nodes = bubble.nodes(tree);
        var node = svg.selectAll(".node")
          .data(nodes)
          .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        node.append("title")
            .text(function(d) { return d.path + ": " + format(d.value); });

        node.append("circle")
            .attr("r", function(d) { return d.r; })
            .style("fill", function(d) { return color(d.depth); });

        if (legendEl) {
            node.on("mouseover",update_legend)
                .on("mouseout",remove_legend);
  
            var legend = d3.select(legendEl);

            function update_legend(d) {
                legend.html(legend_function(d));
                legend.transition().duration(200).style("opacity","1");
            }

            function remove_legend(d) {
                legend.transition().duration(1000).style("opacity","0");
            }
        }
    // node.append("text")
    //     .attr("dy", ".3em")
    //     .style("text-anchor", "middle")
    //     .text(function(d) { return d.name.substring(0, d.r / 3); });
    });
  
  //d3.select(self.frameElement).style("height", diameter + "px");
}

function treeize(list) {
  var tree = {};
  
  for (path in list) {
    if (list.hasOwnProperty(path)) {
      addChild(tree, path.split('/'), path, list[path]);
    }
  }
  
  return tree;
}

function addChild(tree, nameList, path, node) {
  var nameFirst = nameList.shift();
  var child;

  if (nameFirst) {
    tree.children = tree.children || [];
    
    for (var i = 0; i < tree.children.length; i++) {
      if (tree.children[i].name === nameFirst) {
        child = tree.children[i];
        break;
      }
    }

    if (!child) {
      child = {
        name: nameFirst
      };
      tree.children.push(child);
    }

    if (nameList.length > 0) {
      addChild(child, nameList, path, node);
    }
    else {
      child.path = path;
      child.value = node.total_number_of_lines;
    }
  }
  else {
    tree.name = nameFirst;
    tree.path = path;
    tree.value = node.total_number_of_lines;
  }
}
