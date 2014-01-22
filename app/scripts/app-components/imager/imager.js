define([ "app-components/linear-process/switchable-linear-process", "app-components/labware/display", "labware/standard_mappers",
    "app-components/imager/button", "app-components/imager/fileSelector", 
    "app-components/imager/connect"
], function(linearProcess, labwareDisplay, representer, Button, FileSelector, connect) {
  "use strict";
  
  return function(context) {
    var instance = {
      view: "",
      events: {
        "onBegin": function() {
          beginBut.disable(); 
          endBut.enable();
          doneBut.disable();
          return arguments;
        },
        "onEnd": function() {
          endBut.disable(); 
          fileSelector.enable();
          doneBut.disable();
          return arguments;          
        },
        "onSelectedFile": function() {
          uploadBut.enable();
          doneBut.disable();
          return arguments;          
        },
        "onUploadedFile": function() {
          fileSelector.disable();
          uploadBut.disable();
          doneBut.enable();
          return arguments;          
        },
        "onDone": function() {
          var ref = window.location.href;
          ref = ref.replace(/#.*/, "");
          window.location.href = ref;          
        }
      },
      setStatus: function(status) {
        function configButtons(status) {
          var renderButtons = {
            "in_progress": function() {
              beginBut.disable(); 
              endBut.enable(); 
              fileSelector.disable();
              uploadBut.disable();
              doneBut.disable();
            },
            "done": function() {
              beginBut.disable(); 
              endBut.disable(); 
              fileSelector.enable();
              uploadBut.disable();
              doneBut.disable();
            },
            "default": function() {
              beginBut.enable(); 
              endBut.disable(); 
              fileSelector.disable();
              uploadBut.disable();
              doneBut.disable();
            }
          };
          var methodDefault = renderButtons["default"];
          var method = (status && renderButtons[status]) || methodDefault;
          return method();
        }        
      configButtons(status);
      }
    };
    
    // Private attributes
    var LABWARE_DISPLAY="display.labware.s2";    
    var beginBut, endBut, fileSelector, uploadBut, 
        doneBut, labware;

    // Private methods
    var render = _.bind(function() {
      beginBut = new Button({ text : "Begin Imager"});
      endBut = new Button({ text : "End Imager"});
      fileSelector = new FileSelector({ text : "Select"});
      uploadBut = new Button({ text : "Upload"});
      doneBut = new Button({ text : "Done"});
      labware = labwareDisplay({});

      labware.view.append(_.pluck([beginBut, endBut, 
                                   fileSelector, uploadBut, 
                                   doneBut], "view"));
      labware.view.on(labware.events);
      labware.view.trigger(LABWARE_DISPLAY, representer(context.labware));
      labware.view.addClass("imager");
      
      instance.view = labware.view;
    }, instance);
    
    var attachHandlers = _.bind(function() {
      // Attach handlers
      connect(beginBut.events, 'onClicked', this.events, 'onBegin');
      connect(endBut.events, 'onClicked', this.events, 'onEnd');
      connect(fileSelector.events, 'onSelectedFile', this.events, 'onSelectedFile');
      connect(uploadBut.events, 'onClicked', this.events, 'onUploadedFile');
      connect(doneBut.events, 'onClicked', this.events, 'onDone');
    }, instance);

    render();
    attachHandlers();
    
    return instance;
  };
});