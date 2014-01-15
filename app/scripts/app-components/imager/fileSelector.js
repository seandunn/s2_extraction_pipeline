define(["text!app-components/imager/_fileSelector.html"
        ], function(fileSelectorTemplate) {
  "use strict";
  
  return function(context) {
    // Instance
    var instance = {
      view: $(_.template(fileSelectorTemplate)(context)),
      events: {
        "onSelectedFile": _.identity
      },
      enable: function() {
        this.view.attr("disabled", false);
      },
      disable: function() {
        this.view.attr("disabled", true);
      }      
    };
    // Private attributes
    var html       = instance.view;
    var file       = html.find("input[type=file]");
    var filename   = html.find(".filename");
    
    // Private event handling
    $(html[0]).on("click", function() {
      file.val('').click();
      $("input", html).click();
    });
    
    $(html[1]).on("change", function(event) {
      handleFile(html, filename, event.originalEvent.target.files[0]);
    });
    
    // Private methods
    var handleFile = _.bind(function(html, filename, file) {
      var data = _.clone(file);
      var reader       = new FileReader();
      reader.onload    = function(event) {
        $(".filename").text("File: " + file.name);
      };
      reader.onloadend = _.bind(function(event) {
        if (event.target.readyState === FileReader.DONE) {
          this.events.onSelectedFile(_.extend(data, { content: event.target.result}));
        }
      }, this);
      reader.readAsDataURL(file, 'UTF-8');
    }, instance);

    return instance;
  };
});