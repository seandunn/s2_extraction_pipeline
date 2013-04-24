define([
       'text!extraction_pipeline/html_partials/rack_scan_partial.html'
], function(partial) {
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

      var component = this;
      var container = this.selector().empty().append(html);
      var fileNameSpan = container.find('#filenameSpan');

      // add listeners to the hiddenFileInput
      var hiddenFileInput = container.find('#hiddenFileInput');
      hiddenFileInput.bind("change", handleInputFileChanged);

      // add Listeners to the dropZone
      var dropzone = container.find('#drop_zone');
      dropzone.bind('click', handleClickRerackingFile); // forward the click to the hiddenFileInput
      $(document).bind('drop', handleDropRerackingFile);
      $(document).bind('dragover', handleDragOver);

      function handleRerackingFile(fileHandle){
        var reader = new FileReader();
        reader.onload = (function(FILE){
          return function(e){
            fileNameSpan.text(fileHandle.name);
          }
        })(fileHandle);
        reader.readAsText(fileHandle,"UTF-8");
      }

      function handleInputFileChanged(event){
        //
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
          dropzone.addClass('hover');
        } else {
          dropzone.removeClass('hover');
        }
      }


//      container.find('.selectFileButton').on('click', function(event) {
//        //var valid = component.owner.model.validateKitTubes(event.srcElement.value);
////        component.message(
////          valid ? 'success' : 'error',
////          'This kit ' + (valid ? 'is' : 'is not') + ' valid for the selected tubes'
////        );
////        component.owner.model.kit.valid = valid;
////        component.owner.model.fire();
//      });
    },
    toggleHeaderEnabled: function(isEnabled) {
//      this.selector().find('.kitSelect')[isEnabled ? 'removeAttr' : 'attr']('disabled', 'disabled');
    },
    clear: function() {
      this.selector().empty();
    },
    message: function(type, message) {
//      this.selector().find('.validationText').removeClass('alert-error alert-info alert-success').addClass('alert-' + type).text(message);
    }
  });

  return View;
});
