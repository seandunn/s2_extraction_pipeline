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

      this.labwareController.renderView();

      this.labwareController.updateModel(this.model.rack);
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
      this.owner.childDone(this, "disableBtn", {});
    },
    previousDone: function() {
      this.owner.childDone(this, "disableBtn", {});
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
        PubSub.publish("error.status.s2", thisController, { message: error });
      }).then(function(){
        thisController.view.disableDropZone();

        thisController.owner.childDone(this, "disableBtn", {
          buttons: [{action: "print"}]
        });

        thisController.owner.childDone(this, "enableBtn", {
          buttons: [{action: "next"}]
        });

        PubSub.publish("message.status.s2", thisController, { message: "Rack registered." });
      });
    },

    end: function(){
      var thisController = this;
      this.model.save().then(function(message){
        thisController.view.disableDropZone();
        thisController.owner.childDone(thisController, "disableBtn", {buttons: [{action: "end"}]});
        thisController.owner.childDone(thisController, "enableBtn", {buttons: [{action: "next"}]});
        PubSub.publish("message.status.s2", thisController, {message:message})
      },
      function(errorMessage){
        $("body").trigger("error.status.s2", errorMessage);
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
