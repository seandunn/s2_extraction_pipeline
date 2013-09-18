define([], function() {
  'use strict';

  return {
    init: function(target) {
      this.dropzone    = target.find(".dropzoneBox");
      this.fileinput   = target.find("input[type=file]");
      this.filename    = target.find(".filename");
      this.ignoreFiles = function() { };
      this.callback    = this.ignoreFiles;
      bindToDropZone(this);
      return this;
    },

    enable: function(callback) {
      this.fileinput.removeAttr('disabled');
      this.callback = callback;
    },

    disable: function() {
      this.fileinput.attr('disabled', 'disabled');
      this.callback = this.ignoreFiles;
    }
  };

  function bindToDropZone(owner) {
    // Ensure that the dropzone behaves appropriate, delegating showing the file picker to the file input.
    owner.dropzone.bind('click', stopEvents(function() {
      owner.fileinput.click();
    }));
    owner.dropzone.bind('drop', stopEvents(function(event) {
      owner.dropzone.removeClass('hover');
      handleFile(event.originalEvent.dataTransfer.files[0]);
    }));

    // Ensure that the dropzone highlights properly.
    owner.dropzone.bind('dragenter', stopEvents(function(event) {
      owner.dropzone.addClass('hover');
    }));
    owner.dropzone.bind('dragleave', stopEvents(function() {
      owner.dropzone.removeClass('hover');
    }));
    owner.dropzone.bind('dragover', stopEvents(function() {
    }));

    // Ensure that the file input handles changes but doesn't re-propagate the click events, otherwise we end up in a
    // recursive situation where it will call the click handler on the dropzone.
    owner.fileinput.bind('change', stopEvents(function(event) {
      handleFile(event.originalEvent.target.files[0]);
    }));
    owner.fileinput.bind('click', function(event) {
      event.stopPropagation();
    });
    return;

    function stopEvents(f) {
      return function() {
        event.stopPropagation();
        event.preventDefault();
        return f.apply(this, arguments);
      };
    }

    function handleFile(file) {
      var reader       = new FileReader();
      reader.onload    = function(event) {
        owner.filename.text(file.name);
      };
      reader.onloadend = function(event) {
        if (event.target.readyState === FileReader.DONE) {
          owner.callback(event.target.result);
        }
      };
      reader.readAsText(file, 'UTF-8');
    }
  }
});
