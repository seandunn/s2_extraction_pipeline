define([
  'extraction_pipeline/presenters/base_presenter',
  'extraction_pipeline/views/rack_scan_view',
  'extraction_pipeline/models/rack_scan_model',
  'extraction_pipeline/models/volume_check_model',
  'extraction_pipeline/lib/pubsub'
], function (Base, View, RackScanModel, VolumeCheckModel, PubSub) {

  var models = {
    RackScanModel: RackScanModel,
    VolumeCheckModel: VolumeCheckModel
  };

  var Presenter = Object.create(Base);

  _.extend(Presenter, {
    register: function (callback) {
      callback('rack_scan_presenter', function () {
        var instance = Object.create(Presenter);
        Presenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.presenterFactory = factory;
      this.model = Object.create(models[this.config.model]).init(this, config);
      return this;
    },

    setupPresenter: function (input_model, selector) {
      this.selector = selector;
      this.model.setUser(input_model.user);

      this.setupView();
      this.setupSubPresenters();
      this.renderView();
      return this;
    },

    setupSubPresenters: function (reset) {
      var presenter = this;

      if (!presenter.labwarePresenter) {
        presenter.labwarePresenter = presenter.presenterFactory.create('labware_presenter', this);
      }
      presenter.labwarePresenter.setupPresenter({
        "expected_type":    "tube_rack",
        "display_labware":  true,
        "display_remove":   false,
        "display_barcode":  false
      }, function() {
        return presenter.selector().find('.labware');
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
      this.labwarePresenter.renderView();
      return this;
    },

    initialPresenter: function () {
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
      this.model.fire();
    },

    end: function(child,action, data){
      this.model.saveVolumes();
    },

    next: function(child,action, data){
      this.owner.childDone(this, "done", {batch: this.model.batch, user: this.model.user});
    },

    viewDone: function (child, action, data) {
      var thisPresenter = this;
      if (action === 'fileRead') {
        this.model.analyseFileContent(data)
          .fail(function () {
            PubSub.publish('s2.status.error', thisPresenter, {message:"Impossible to find the required resources. Contact the system administrator."});
          })
          .then(function(tube_rack){
          thisPresenter.childDone(thisPresenter.model, "fileValid", {model: tube_rack, message: 'The file has been processed properly. Click on the \'Start\' button to validate the process.'})
        });
      } else if (action === 'transferAuthorised') {
        this.model.fire();
      }
    },

    modelDone: function (child, action, data) {
      if (action === 'fileValid') {
        this.view.validateFile(data.message);
        this.labwarePresenter.updateModel(data.model);
        this.owner.childDone(this, "enableBtn", {buttons: [{action: "print"}]});
        this.owner.childDone(this, "enableBtn", {buttons: [{action: "end"}]});
      } else if (action === 'error') {
        //this.view.in(data);
        this.view.error(data);
      } else if (action === 'transferDone') {
        this.view.disableDropZone();
        this.owner.childDone(this, "disableBtn", {buttons: [{action: "print"}]});
        this.owner.childDone(this, "enableBtn", {buttons: [{action: "next"}]});
      } else if (action === 'volumesSaved') {
        this.view.disableDropZone();
        this.owner.childDone(this, "disableBtn", {buttons: [{action: "end"}]});
        this.owner.childDone(this, "enableBtn", {buttons: [{action: "next"}]});
      }
    }
  });

  return Presenter;
});
