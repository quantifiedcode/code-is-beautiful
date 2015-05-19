describe("Treeize function", function() {
  var input = {
    "": {
      "average_number_of_characters": 5664.889, 
      "average_number_of_lines": 148.549, 
      "number_of_files": 1000, 
      "total_number_of_characters": 5664889, 
      "total_number_of_lines": 148549
    }, 
    "django": {
      "average_number_of_characters": 5299.541769041769, 
      "average_number_of_lines": 141.1891891891892, 
      "number_of_files": 814, 
      "total_number_of_characters": 4313827, 
      "total_number_of_lines": 114928
    },
    "django/__init__.py": {
      "average_number_of_characters": 519.0,
      "average_number_of_lines": 19.0,
      "number_of_files": 1,
      "total_number_of_characters": 519,
      "total_number_of_lines": 19
    },
    "django/apps": {
      "average_number_of_characters": 7713.0,
      "average_number_of_lines": 195.0,
      "number_of_files": 3,
      "total_number_of_characters": 23139,
      "total_number_of_lines": 585
    },
    "django/apps/__init__.py": {
      "average_number_of_characters": 78.0,
      "average_number_of_lines": 3.0,
      "number_of_files": 1,
      "total_number_of_characters": 78,
      "total_number_of_lines": 3
    }
  };

  it("should populate the root node", function() {
    var tree = treeize(input);
    expect(tree.name).toBe('');
    expect(tree.value).toBe(148549);
  });
  
  it("should create some child nodes", function() {
    var tree = treeize(input);
    expect(tree.children).toBeDefined();
    
    var djangoChild = tree.children[0];
    
    expect(djangoChild.name).toBe('django');
    expect(djangoChild.value).toBe(114928);
  });
  
  it ("should create some sub-children nodes too", function() {
    var tree = treeize(input);
    var djangoChild = tree.children[0];
    var appsChild;
    
    expect(djangoChild.children).toBeDefined();
    
    for (var i = 0; i < djangoChild.children.length; i++) {
      if (djangoChild.children[i].name === 'apps') {
        appsChild = djangoChild.children[i];
        break;
      }
    }
    
    expect(appsChild).toBeDefined();
    expect(appsChild.name).toBe('apps');
    expect(appsChild.value).toBe(585);
    expect(appsChild.children).toBeDefined();    
  });
});
