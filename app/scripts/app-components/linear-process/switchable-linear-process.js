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
    
    context.focusClass = context.focusClass || "";
    context.blurClass = context.blurClass || "";
    context.skipClass = context.skipClass || "";
    
    _.each(components, function(component) {
      // Initial state is disabled
      disableComponent(component, context.focusClass, context.blurClass);
      
      var componentStatus = {
        skipped: false
      };
      
      component.view.on("skip.s2", _.partial(function(status, focusClass, blurClass, skipClass) {
        component.view.addClass(skipClass);  
        component.view.removeClass(focusClass);
        component.view.removeClass(blurClass);
        status.skipped=true;
      }, componentStatus, context.focusClass, context.blurClass, context.skipClass));
      
      function handlerDisabler(handler, status) {
        return function() {
          if (!status.skipped) {
            return handler.apply(this, arguments);
          }
        };
      }
      
      component.view.on("activate.s2", handlerDisabler($.stopsPropagation(_.partial(
        enableComponent, component, context.focusClass, context.blurClass)), componentStatus));
      component.view.on("deactivate.s2", handlerDisabler($.stopsPropagation(_.partial(
        disableComponent, component, context.focusClass, context.blurClass)), componentStatus));
    });
    
    return obj;
  };
   
  function disableComponent(component, focusClass, blurClass) {
    component.view.prop("disabled", true);
    
    $("input,select,button", component.view).prop("disabled", true);
    component.view.removeClass(focusClass);
    component.view.addClass(blurClass);
    return false;
  }
  
  function enableComponent(component, focusClass, blurClass) {
    component.view.prop("disabled", false);
    $("input, select, button", component.view).prop("disabled", false);
    component.view.removeClass(blurClass);
    component.view.addClass(focusClass);
    return false;
  }  
  
});