define([
  "text!app-components/dropzone/_component.html"
], function(view) {
  'use strict';

  var template = _.compose($, _.template(view));

  return function(context) {
    var view = createHtml(context);

    return {
      name: "dropzone.s2",
      view: view,
      events: {}
    };
  };

  function createHtml(context) {
    var html = template(_.extend({
      mime:    undefined,
      message: undefined
    }, context));

    var dropTarget = html.find(".target");
    var file       = html.find("input[type=file]");
    var filename   = html.find(".filename");
    var handle     = _.partial(handleFile, html, filename);

    // Ensure that the dropzone behaves appropriate, delegating showing the file picker to the file input.
    dropTarget.bind('click', stopEvents(function() {
      file.val('').click();    // Reset the value, so that the change event is triggered
    }));
    dropTarget.bind('drop', stopEvents(function(event) {
      dropTarget.removeClass('hover');
      handle(event.originalEvent.dataTransfer.files[0]);
    }));

    // Ensure that the dropzone highlights properly.
    dropTarget.bind('dragenter', stopEvents(function(event) {
      dropTarget.addClass('hover');
    }));
    dropTarget.bind('dragleave', stopEvents(function() {
      dropTarget.removeClass('hover');
    }));
    dropTarget.bind('dragover', stopEvents(function() {
      // NOTE: Ignore this event, just stop it propogating
    }));

    // Ensure that the file input handles changes but doesn't re-propagate the click events, otherwise we end up in a
    // recursive situation where it will call the click handler on the dropzone.
    file.bind('change', stopEvents(function(event) {
      handle(event.originalEvent.target.files[0]);
    }));
    file.bind('click', function(event) {
      event.stopPropagation();
    });

    return html;
  }

  function stopEvents(f) {
    return function(event) {
      event.stopPropagation();
      event.preventDefault();
      return f.apply(this, arguments);
    };
  }

  function handleFile(html, filename, file) {
    var reader       = new FileReader();
    reader.onload    = function(event) {
      filename.text(file.name);
    };
    reader.onloadend = function(event) {
      if (event.target.readyState === FileReader.DONE) {
        html.trigger("dropzone.file", [event.target.result]);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }
});
