define(["data/helpers"],function(dataHelpers){
    return {
        complexityExample : function(example){
            var data = dataHelpers.loadJson('../data/'+example+'_complexity.json');
            return data;
        },
    }
});
