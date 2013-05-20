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

      presenter.barcodePresenter.init({ type: 'Kit' });

      presenter.selector().find('.barcode').append(presenter.barcodePresenter.renderView());
      presenter.selector().find('.barcode input').focus();

      return presenter;
    },

    focus: function() { },

    release: function() {
      this.view.clear();
      return this;
    },

    initialPresenter: function() {
      // Does nothing, for the moment!
      this.owner.childDone(this, 'disableBtn', this.config);
    },

    childDone: function(child, action, data) {
      if (action === 'barcodeScanned') {
        this.model.kit.barcode = data;
        this.model.fire();
      } else if (action === 'saved') {
        this.view.message('info', 'Kit details saved');
        this.view.selector().find(".barcodeInput").attr('disabled', true);
        this.owner.childDone(this, 'done', data);
    } else if (action === 'error') {
        this.view.message('error', data.message);
      }
    }
  });

  return Presenter;
});
