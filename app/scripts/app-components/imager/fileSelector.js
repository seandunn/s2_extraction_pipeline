define(["text!app-components/imager/_fileSelector.html"
        ], function(fileSelectorTemplate) {
  "use strict";
  
  return function(context) {
    var html = $(_.template(fileSelectorTemplate)(context));
    var file       = html.find("input[type=file]");
    var filename   = html.find(".filename");
    
    $(html[0]).on("click", function() {
      file.val('').click();
      $("input", html).click();
    });
    
    $(html[1]).on("change", function(event) {
      handleFile(html, filename, event.originalEvent.target.files[0]);
    });
    
    function handleFile(html, filename, file) {
      var data = _.clone(file);
      var reader       = new FileReader();
      reader.onload    = function(event) {
        $(".filename").text("File: " + file.name);
      };
      reader.onloadend = function(event) {
        if (event.target.readyState === FileReader.DONE) {
          if (context.action) {
            html.trigger(context.action, _.extend(data, { content: event.target.result}));
          }
          html.trigger("uploaded.request.imager.s2", _.extend(data, { content: event.target.result}));
          html.trigger("done.s2");
        }
      };
      reader.readAsDataURL(file, 'UTF-8');
    }
        
    return {
      view: html,
      events: {
        "activate.s2": $.haltsEvent($.ignoresEvent(_.partial(_.bind(html.attr, html), "disabled", false)))
      }
    };
  };
});