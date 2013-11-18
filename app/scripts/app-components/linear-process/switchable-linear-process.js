define([
        "app-components/linear-process/linear-process"
  // Globally included stuff added after this comment
  , "lib/jquery_extensions"
], function (LinearProcess) {
  "use strict";
  return function(context) {
    /**
     * On every iteration of the process, it disables all the 
     * components and enables the focused.
     */
    
    var obj = new LinearProcess(context);
    var components = obj.components;
    
    obj.events["activate.s2"] = _.wrap(
      obj.events["activate.s2"],
      /* Execute the enabling of components wherever they come from */
      function(f, event, view) {
        view = view || event.target;
        var component = _.find(components, function(component) {
          return component.view[0] === view;
        });
        if (component) {
          enableComponent(component);
        }
        var args = Array.prototype.slice.call(arguments, 1);
        return f.apply(this, args);
      });
    
    obj.events["deactivate.s2"] = function(event, view) {
      _.each(components, disableComponent);
    };
    
    return obj;
  };
  
  function disableComponent(component) {
    component.view.prop("disabled", true);
  }
  
  function enableComponent(component) {
    component.view.prop("disabled", false);
  }  
  
});