define([
  'controllers/base_controller',
  'views/rack_scan_view',
  'models/rack_scan_model',
  'models/volume_check_model',
  'lib/pubsub'
], function (Base, View, RackScanModel, VolumeCheckModel, PubSub) {

  var models = {
    RackScanModel: RackScanModel,
    VolumeCheckModel: VolumeCheckModel
  };

  var Controller = Object.create(Base);

  _.extend(Controller, {
    register: function (callback) {
      callback('rack_scan_controller', function () {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.controllerFactory = factory;
      this.model = Object.create(models[this.config.model]).init(this, config);
      return this;
    },

    setupController: function (input_model, selector) {
      this.selector = selector;
      this.model.setUser(input_model.user);

      this.setupView();
      this.setupSubControllers();
      this.renderView();
      return this;
    },

    setupSubControllers: function (reset) {
      var controller = this;

      if (!controller.labwareController) {
        controller.labwareController = controller.controllerFactory.create('labware_controller', this);
      }
      controller.labwareController.setupController({
        "expected_type":    "tube_rack",
        "display_labware":  true,
        "display_remove":   false,
        "display_barcode":  false
      }, function() {
        return controller.selector().find('.labware');
      });
      return this;
    },

    setupSubModel: function () {
      return this;
    },

    focus: function () {
    },

    setupView: function () {
      this.view = new View(this, this.selector);
      return this;
    },

    release: function () {
      this.view.clear();
      return this;
    },

    renderView: function () {
      this.view.renderView({
        batch: this.model.batch && this.model.batch.uuid,
        user: this.model.user
      });
      this.labwareController.renderView();
      return this;
    },

    initialController: function () {
      this.owner.childDone(this, "disableBtn", {});
    },

    childDone: function (child, action, data) {
      if (child === this.view) {
        this.viewDone(child, action, data);
      } else if (child === this.model) {
        this.modelDone(child, action, data);
      }
    },

    print: function(child,action, data){
      var thisController = this,
          printer       = $('.printer-select').val();

      this.model.fire(printer).fail(function(error){
        PubSub.publish('s2.status.error', thisController, error);
      }).then(function(){
        thisController.view.disableDropZone();

        thisController.owner.childDone(this, "disableBtn", {
          buttons: [{action: "print"}]
        });

        thisController.owner.childDone(this, "enableBtn", {
          buttons: [{action: "next"}]
        });

        PubSub.publish('s2.status.message', thisController, "Rack registered.");
      })
    },

    end: function(child,action, data){
      this.model.saveVolumes();
    },

    next: function(child,action, data){
      this.owner.childDone(this, "done", {batch: this.model.batch, user: this.model.user});
    },

    viewDone: function (child, action, data) {
      var thisController = this;
      if (action === 'fileRead') {
        this.model.analyseFileContent(data)
          .fail(function () {
            PubSub.publish('s2.status.error', thisController, {message:"Impossible to find the required resources. Contact the system administrator."});
          })
          .then(function(tube_rack){
          thisController.childDone(thisController.model, "fileValid", {model: tube_rack, message: 'The file has been processed properly. Click on the \'Start\' button to validate the process.'})
        });
      } else if (action === 'transferAuthorised') {
        this.model.fire();
      }
    },

    modelDone: function (child, action, data) {
      if (action === 'fileValid') {
        this.view.validateFile(data.message);
        this.labwareController.updateModel(data.model);
        this.owner.childDone(this, "enableBtn", {buttons: [{action: "print"}]});
        this.owner.childDone(this, "enableBtn", {buttons: [{action: "end"}]});
      } else if (action === 'error') {
        //this.view.in(data);
        this.view.error(data);
      } else if (action === 'transferDone') {
      } else if (action === 'volumesSaved') {
        this.view.disableDropZone();
        this.owner.childDone(this, "disableBtn", {buttons: [{action: "end"}]});
        this.owner.childDone(this, "enableBtn", {buttons: [{action: "next"}]});
      }
    }
  });

  return Controller;
});
