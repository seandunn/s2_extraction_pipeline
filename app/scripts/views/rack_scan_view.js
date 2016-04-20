//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  "text!html_partials/_rack_scan.html",
  "lib/pubsub",
  "app-components/dropzone/dropzone",
  "event_emitter"
], function(partial, PubSub, dropZone, EventEmitter) {
  "use strict";  
  
  var View = function(owner, selector) {
    this.owner    = owner;
    this.selector = selector;
    this.template = _.template(partial);
    this.dropzone = undefined;
    return this;
  };

  _.extend(View.prototype, EventEmitter.prototype, {
    renderView: function(model) {
      var html = this.template({
        user: model.user,
        processTitle: model.processTitle
      });

      var container = this.selector().empty().append(html);
      container.addClass(this.owner.model.containerName).addClass("pre-file");

      this.dropzone = dropZone(this);
      container.find(".dropzone").append(this.dropzone.view).on(this.dropzone.events);
      
      container.on("dropzone.file", _.bind(function(event, contents) {
        this.emit("fileLoaded", contents);
      }, this));
    },

    // TODO: should be triggered via an event
    disableDropZone:function(){
      this.dropzone.view.prop("disabled", true);
    },
    
    updateToValidatedFile: function() {
      var container = this.selector();
      container.removeClass("pre-file').addClass('post-file");      
    },

    clear: function() {
      this.selector().empty().off();
    },

  });

  return View;
});
