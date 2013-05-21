define([
  'extraction_pipeline/presenters/base_presenter',
  'text!extraction_pipeline/html_partials/kit_partial.html',
  'extraction_pipeline/models/kit_model',
  'extraction_pipeline/lib/pubsub',
  'extraction_pipeline/lib/barcode_checker'
], function(Base, kitPartialHtml, Model, PubSub, BarcodeChecker) {
  'use strict';


  function validationOnReturnKeyCallback (presenter) {
    return function (element, callback, errorCallback) {
      // validation of the barcode on return key
      return function (event) {
        if (event.which !== 13) return;
        if (BarcodeChecker.isKitBarcodeValid(event.currentTarget.value)) {
          callback(event, element, presenter);
        } else {
          errorCallback(event, element, presenter);
        }
      };
    }
  }

  function kitScannedCallback(presenter) {
    return function (event, template, presenter) {
      template.find('.alert-error').addClass('hide');
      template.find("input").attr('disabled', true);
      presenter.model
          .then(function(model){
            return model.setKitFromBarcode(event.currentTarget.value)
          })
          .fail(function (error) {
            presenter.message('error', error.message);
            template.find(".barcodeInput").attr('disabled', false);

          })
          .then(function(model){
            presenter.message('info', 'Kit details validated/saved');
            template.find(".barcodeInput").attr('disabled', true);
//            presenter.owner.childDone(this, 'done', data);
            PubSub.publish("s2.step_presenter.next_process", presenter, {batch: model.batch});
          })
      ;
    }
  }

  function kitScannedErrorCallback(presenter) {
    return function (errorText) {
      var errorHtml = function (errorText) {
        return $("<h4/>", {class: "alert-heading", text: errorText});
      };
      return function (event, template, presenter) {
        template.
            find('.alert-error').
            html(errorHtml(errorText)).
            removeClass('hide');
        template.
            find('input').
            removeAttr('disabled');
      };
    };
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

      presenter.selector    = selector;
      presenter.model
          .then(function (model) {
            return model.setupModel(setupData);
          })
          .then(function(model){
//            presenter.view = new View(presenter, presenter.selector);

//            presenter.view.renderView(presenter.model);
            presenter.selector().html(_.template(kitPartialHtml)({}));

            presenter.barcodePresenter = presenter.presenterFactory.create('scan_barcode_presenter', presenter);
            presenter.barcodePresenter.init({ type: 'Kit' });
            presenter.selector()
                .find('.barcode')
                .append(presenter.bindReturnKey( presenter.barcodePresenter.renderView(), kitScannedCallback(presenter), kitScannedErrorCallback(presenter)('Barcode must be a 13 digit number.'), validationOnReturnKeyCallback(presenter) ));
            presenter.selector().find('.barcode input').focus();
          });
      return presenter;
    },

    message: function (type, message) {
      if (!type) {
        this.selector()
            .find('.validationText')
            .hide();
      } else {
        this.selector()
            .find('.validationText')
            .show()
            .removeClass('alert-error alert-info alert-success')
            .addClass('alert-' + type)
            .html(message);
      }
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
//      if (action === 'barcodeScanned') {
//        //this.model.kit.barcode = data;
//        //this.model.fire();
//      } else if (action === 'saved') {
//        this.view.message('info', 'Kit details saved');
//        this.view.selector().find(".barcodeInput").attr('disabled', true);
//        this.owner.childDone(this, 'done', data);
//    } else if (action === 'error') {
//        this.view.message('error', data.message);
//      }
    }

  });

  return Presenter;
});
