define([
  'extraction_pipeline/presenters/base_presenter',
  'text!extraction_pipeline/html_partials/kit_partial.html',
  'extraction_pipeline/models/kit_model',
  'extraction_pipeline/lib/pubsub',
  'extraction_pipeline/lib/barcode_checker',
  'extraction_pipeline/lib/util'
], function(Base, kitPartialHtml, Model, PubSub, BarcodeChecker, Util) {
  'use strict';


  function validationOnReturnKeyCallback (presenter) {
    return function (element, callback, errorCallback) {
      // validation of the barcode on return key
      return function (event) {
        if (event.which !== 13) return;

        var value = event.currentTarget.value;
        var barcodeSelection = $(event.currentTarget);
        setScannerTimeout(barcodeSelection);

        if (BarcodeChecker.isKitBarcodeValid(Util.pad(value, 22))) {
          callback(value, element, presenter);
        } else {
          errorCallback(value, element, presenter);
        }
      };
    }
  }

  function kitScannedCallback(presenter) {
    return function (value, template, presenter) {
      presenter.model
          .then(function(model){
            return model.setKitFromBarcode(Util.pad(value, 22));
          })
          .fail(function (error) {
            PubSub.publish('s2.status.error', presenter, error);
          })
          .then(function(model){
            PubSub.publish('s2.status.message', presenter, {message:'Kit details validated/saved'});
            PubSub.publish("s2.step_presenter.next_process", presenter, {batch: model.batch});
            presenter.selector().find('.barcodeInput').attr("disabled", "disabled");
          });
    }
  }

  function kitScannedErrorCallback(presenter) {
    return function (errorText) {
      return function (value, template, presenter) {
        PubSub.publish('s2.status.error', presenter, {message:errorText});
      };
    };
  }

  function setScannerTimeout(barcodeSelection){
    setTimeout(function () {
      barcodeSelection.val('');
    }, 250);
  }

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

    setupPresenter: function(setupData, selector) {
      var presenter = this;
      presenter.selector = selector;
      presenter.model
          .then(function (model) {
            return model.setupModel(setupData);
          })
          .then(function(model){
          if(!model.batch.kit){
            presenter.selector().html(_.template(kitPartialHtml)({}));
            presenter.barcodePresenter = presenter.presenterFactory.create('scan_barcode_presenter', presenter);
            presenter.barcodePresenter.init({ type: 'Kit' });
            presenter.selector()
                .find('.barcode')
                .append(presenter.bindReturnKey( presenter.barcodePresenter.renderView(), kitScannedCallback(presenter), kitScannedErrorCallback(presenter)('Barcode must be a 22 digit number.'), validationOnReturnKeyCallback(presenter) ));
            presenter.selector().find('.barcode input').focus();
          }
          });
      return presenter;
    },

    focus: function () {
      var presenter = this;
      presenter.model
        .then(function (model) {
          if (model.batch.kit) {
            PubSub.publish("s2.step_presenter.next_process", presenter, {batch: model.batch});
          }
        });
    },

    release: function() {
      this.view.clear();
      return this;
    },

    initialPresenter: function() {
      // Does nothing, for the moment!
      this.owner.childDone(this, 'disableBtn', this.config);
    },

    childDone: function(child, action, data) {
    }

  });

  return Presenter;
});
