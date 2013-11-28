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
    linear.view.append(labware.view);
    linear.view.on(labware.events);
    
    linear.view.trigger(LABWARE_DISPLAY, representer(context.labware));
        
    return linear;
  };
});