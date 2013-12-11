define(["text!app-components/imager/_button.html"], function(buttonTemplate) {
  "use strict";
  
  return function(context) {
    var html = $(_.template(buttonTemplate, context));
    
    html.html(context.text);
    
    html.on("click", function() {
      html.trigger("done.s2");
      if (context.action) {
        html.trigger(context.action);
      }
    });
        
    return ({
      view: html,
      events: {
        "activate.s2": $.haltsEvent(function() {})
      }
    });
  };
});