define(["data/helpers"],function(dataHelpers){
    return {
        complexityExample : function(){
            var data = dataHelpers.loadJson('../data/django_summary.json');
            return data;
        },
    }
})