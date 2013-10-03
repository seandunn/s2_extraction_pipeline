define([
  "text!html_partials/_rack_scan.html",
  "lib/pubsub",
  "app-components/dropzone/component"
], function(partial, PubSub, DropZone) {
  "use strict";

  var View = function(owner, selector) {
    this.owner    = owner;
    this.selector = selector;
    this.template = _.template(partial);
    this.dropzone = undefined;
    return this;
  };

  _.extend(View.prototype, {
    renderView: function(model) {
      var html = this.template({
        user: model.user,
        processTitle: model.processTitle
      });

      var container = this.selector().empty().append(html);
      container.addClass(this.owner.model.containerName).addClass('pre-file');
      var fileNameSpan = container.find(".filenameSpan");

      // thisController is used until I can sort out these messy event handlers.
      // NB. This sort of nonsense make me a sad panda :(
      var thisController = this.owner;
      this.dropzone = DropZone(this);
      container.find(".dropzone").append(this.dropzone.view).on(this.dropzone.events);
      container.on("dropzone.file", function(event, contents) {
        thisController.model
                      .analyseFileContent(contents)
                      .then(function(scanModel){
                        container.removeClass('pre-file').addClass('post-file');

                        PubSub.publish('s2.status.message', thisController, {message: "File validated."});

                        // We update the labware view but we've already translated it, so force the display to
                        // be the identity, rather than the default mapping.
                        thisController.labwareController.updateModel(scanModel.rack, _.identity);

                        thisController.owner.childDone(this, "enableBtn", {buttons: [{action: "print"}]});
                        thisController.owner.childDone(this, "enableBtn", {buttons: [{action: "end"}]});
                      }, function (errorMessage) {
                        PubSub.publish("s2.status.error", thisController, {message: errorMessage});
                      });
      });
    },

    // TODO: should be triggered via an event
    disableDropZone:function(){
      this.dropzone.prop("disabled", true);
    },

    clear: function() {
      this.selector().empty().off();
    },

  });

  return View;
});
