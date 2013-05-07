define([
  'extraction_pipeline/presenters/base_presenter',
  'extraction_pipeline/views/kit_view',
  'extraction_pipeline/models/kit_model'
], function(Base, View, Model) {
  var Presenter = Object.create(Base);

  _.extend(Presenter, {
    register: function(callback) {
      callback('kit_presenter', function() {
        var instance = Object.create(Presenter);
        Presenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function(owner, factory, config) {
      this.owner            = owner;
      this.config           = config;
      this.presenterFactory = factory;
      this.model            = Object.create(Model).init(this, config);
      return this;
    },

    setupPresenter: function(model, selector) {
      var presenter = this;

      presenter.selector    = selector;
      presenter.model.batch = model.batch;

      presenter.view = new View(presenter, presenter.selector);

      presenter.view.renderView(presenter.model);

      presenter.barcodePresenter = presenter.presenterFactory.create('scan_barcode_presenter', presenter);

      presenter.barcodePresenter.init({ type: 'Kit', barcode: 'Kit0001' });

      presenter.selector().find('.barcode').append(presenter.barcodePresenter.renderView());

      return presenter;
    },

    focus: function() {
      // this.barcodePresenter.focus();
    },

    release: function() {
      this.view.clear();
      return this;
    },

    initialPresenter: function() {
      // Does nothing, for the moment!

      var data = {};
      data.actions = this.config.buttons;
      this.owner.childDone(this, 'disableBtn', data);
    },

    childDone: function(child, action, data) {
      if (action === 'barcodeScanned') {
        this.model.kit.barcode = data;
        this.model.fire();
      } else if (action === 'saved') {
        this.view.message('info', 'Kit details saved');
        this.owner.childDone(this, 'done', data);
      }
    }
  });

  return Presenter;
});
