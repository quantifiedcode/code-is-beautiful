#About

This is a visualization of the Flask Python source code, generated using D3. Technically, it is a hierarchical pie chart, that looks like a sunburst.

To build this graph, we pulled the source code from the Flask repository on github and calculated the number of lines and number of characters of each Python file in it. Using that information, we generated a hierarchical graph of the code which shows the fraction of the total characters contained in each directory and file.

Using this visualization, it is easy to see how the code is distributed in the repository. You can click on individual segments to get a zoomed-in view of individual branches (click on the central element to get back to the last view).

# Screenshot

![Alt text](/sunburst.png?raw=true "Hierarchical pie chart (Sunburst)")
