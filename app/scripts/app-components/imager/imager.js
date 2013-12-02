define([ "app-components/linear-process/switchable-linear-process", "app-components/labware/display", "labware/standard_mappers",
    "app-components/imager/button", "app-components/imager/fileSelector",
], function(linearProcess, labwareDisplay, representer, button, fileSelector) {
  "use strict";
  
  return function(context) {
    var LABWARE_DISPLAY="display.labware.s2";
    var linear = linearProcess({ 
      components : [
        { constructor : _.partial(button, { text : "Begin Imager", action: "begin.imager.s2" }) },
        { constructor : _.partial(button, { text : "End Imager", action: "completed.imager.s2" }) },
        { constructor : _.partial(fileSelector, { text : "Select", action: "uploaded.file.imager.s2" }) },
        { constructor : _.partial(button, { text : "Upload", action: "upload.request.imager.s2", notDisable: true }) }
      ]});
    
    var labware = labwareDisplay({});
    linear.view.on(labware.events);
    linear.view.on("login.imager.s2", function() {
      window.location.href=window.location.href;
    });
    
    linear.view.trigger(LABWARE_DISPLAY, representer(context.labware));
    linear.view.addClass("imager");
    var html = labware.view;
    html.append(linear.view);
    var component = {
      view: html,
      events: linear.events
    };
    
    return component;
  };
});