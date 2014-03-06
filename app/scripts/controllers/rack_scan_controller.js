define([
  "controllers/base_controller",
  "views/rack_scan_view",
  "models/rack_scan_model",
  "models/volume_check_model",
  "models/nano_drop",
  "lib/pubsub"
], function (Base, View, RackScanModel, VolumeCheckModel, NanoDrop, PubSub) {
  "use strict";

  var models = {
    RackScanModel: RackScanModel,
    VolumeCheckModel: VolumeCheckModel,
    NanoDropModel: NanoDrop
  };

  var Controller = Object.create(Base);

  _.extend(Controller, {
    register: function (callback) {
      callback("rack_scan_controller", function () {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.class = "RackScanController";
      this.owner = owner;
      this.config = config;
      this.controllerFactory = factory;
    },

    setupController: function (inputModel, selector) {
      this.model = Object.create(models[this.config.model]).init(this, this.config, inputModel);
      this.model.containerName = this.config.model;

      this.selector = selector;
      this.view = new View(this, this.selector);

      this.setupSubControllers();

      this.view.renderView({
        batch: this.model.batch && this.model.batch.uuid,
        user: this.model.user
      });
      
      this.view.on("fileLoaded", _.bind(this.onFileLoaded, this));

      this.labwareController.renderView();
      this.labwareController.updateModel(this.model.rack);
    },
    
    onFileLoaded: function(contents) {
      this.model.analyseFileContent(contents).then(_.bind(function(scanModel){
        this.view.updateToValidatedFile();

        PubSub.publish("message.status.s2", this, {message: "File validated."});

        // We update the labware view but we've already translated it, so force the display to
        // be the identity, rather than the default mapping.
        this.labwareController.updateModel(scanModel.rack, _.identity);

        this.emit("validatedFile");
      }, this), function (errorMessage) {
        PubSub.publish("error.status.s2", this, errorMessage);
      });
    },

    setupSubControllers: function () {
      var controller = this;
      controller.labwareController = controller.controllerFactory.create("labware_controller", this);

      controller.labwareController.setupController({
        expected_type:    this.model.expected_type,
        display_labware:  true,
        display_remove:   false,
        display_barcode:  false,
        remap:            _.identity
      }, function() {
        return controller.selector().find(".labware");
      });
    },

    focus: function () {},

    release: function () {
      this.view.clear();
      return this;
    },

    initialController: function () {
    },
    previousDone: function() {
    },

    childDone: function (child, action, data) {
      if (child === this.view) {
        this.viewDone(child, action, data);
      } else {
        // debugger
      }
    },

    print: function(){
      var thisController = this;
      var printer        = $(".printer-select").val();

      this.model.fire(printer).fail(function(error){
        PubSub.publish("error.status.s2", thisController, error);
      }).then(function(){
        thisController.view.disableDropZone();

        thisController.emit("processBegin");
        thisController.emit("processFinished");

        PubSub.publish("message.status.s2", thisController, { message: "Rack registered." });
      });
    },

    end: function(){
      this.model.save().then(_.bind(function(message){
        this.view.disableDropZone();
        this.emit("transferCompleted");
        this.emit("processFinished");
        PubSub.publish("message.status.s2", this, {message:message})
      }, this),
      function(errorMessage){
        $("body").trigger("error.status.s2", errorMessage);
        PubSub.publish("error.status.s2", this, {message:message})
      });
    },

    next: function(){
      this.owner.childDone(this, "done", {batch: this.model.batch, user: this.model.user});
    },

    viewDone: function (child, action) {
      if (action === "transferAuthorised") {
        this.model.fire();
      }
    }

  });

  return Controller;
});
