define(["text!app-components/imager/_button.html"], function(buttonTemplate) {
  "use strict";
  
  return function(context) {
    var instance = {
      view: $(_.template(buttonTemplate, context)),
      events: {
        "onClicked": _.identity
      },
      enable: function() {
        this.view.attr("disabled", false);
      },
      disable: function() {
        this.view.attr("disabled", true);
      }      
    };
    
    instance.view.on("click", _.bind(function(e) {
      e.preventDefault();
      instance.events.onClicked();
    }, instance));
    
    return instance;
  };
});