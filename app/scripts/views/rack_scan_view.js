define([
  "text!html_partials/_rack_scan.html",
  "lib/pubsub"
], function(partial, PubSub) {
  "use strict";

  var View = function(owner, selector) {
    this.owner    = owner;
    this.selector = selector;
    this.template = _.template(partial);
    return this;
  };

  _.extend(View.prototype, {
    renderView: function(model) {
      var html = this.template({
        user: model.user,
        processTitle: model.processTitle
      });

      var container = this.selector().empty().append(html);
      var fileNameSpan = container.find(".filenameSpan");

      // add listeners to the hiddenFileInput
      var hiddenFileInput = container.find(".hiddenFileInput");
      hiddenFileInput.bind("change", handleInputFileChanged);

      // add Listeners to the dropZone
      var dropzone = container.find(".dropzone");
      dropzone.bind("click", handleClickRerackingFile); // forward the click to the hiddenFileInput
      $(document).bind("drop", handleDropRerackingFile);
      $(document).bind("dragover", handleDragOver);

      // thisController is used until I can sort out these messy event handlers.
      // NB. This sort of nonsense make me a sad panda :(
      var thisController = this.owner;
      function handleRerackingFile(fileHandle){
        var reader = new FileReader();

        reader.onload = function(){ fileNameSpan.text(fileHandle.name); };

        reader.readAsText(fileHandle,"UTF-8");

        reader.onloadend = function(event){
          if(event.target.readyState === FileReader.DONE){
            thisController
            .model
            .analyseFileContent(event.target.result)
            .then(function(scanModel){
              PubSub.publish('s2.status.message', thisController, {message: "File validated."});
              thisController.labwareController.updateModel(scanModel.rack);
              thisController.owner.childDone(this, "enableBtn", {buttons: [{action: "print"}]});
              thisController.owner.childDone(this, "enableBtn", {buttons: [{action: "end"}]});
            },
            function (errorMessage) {
              PubSub.publish("s2.status.error", thisController, {message: errorMessage});
            });

          }
        };

      }

      function handleInputFileChanged(event){
        event.stopPropagation();
        event.preventDefault();
        handleRerackingFile(event.originalEvent.target.files[0]);
      }

      function handleClickRerackingFile(event){
        event.stopPropagation();
        event.preventDefault();
        if (hiddenFileInput){
          hiddenFileInput.click();
        }
      }

      function handleDropRerackingFile(event){
        event.stopPropagation();
        event.preventDefault();
        handleRerackingFile(event.originalEvent.dataTransfer.files[0]);
      }

      function handleDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        if (event.target === dropzone[0]) {
          dropzone.addClass("hover");
        } else {
          dropzone.removeClass("hover");
        }
      }
    },

    // TODO: should be triggered via an event
    disableDropZone:function(){
      var container = this.selector();
      container.find(".dropzoneBox").hide();
      // container.find(".dropzone").unbind("click");
      $(document).unbind("drop");
      $(document).unbind("dragover");
    },

    clear: function() {
      this.selector().empty().off();
    },

  });

  return View;
});
