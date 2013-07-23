define([
  'extraction_pipeline/controllers/base_controller',
  'text!extraction_pipeline/html_partials/kit_partial.html',
  'extraction_pipeline/models/kit_model',
  'extraction_pipeline/lib/pubsub',
  'extraction_pipeline/lib/barcode_checker',
  'extraction_pipeline/lib/util'
], function(Base, kitPartialHtml, Model, PubSub, BarcodeChecker, Util) {
  'use strict';


  function validationOnReturnKeyCallback (controller) {
    return function (element, callback, errorCallback) {
      // validation of the barcode on return key
      return function (event) {
        if (event.which !== 13) return;

        var value = Util.pad(event.currentTarget.value, 22);
        var barcodeSelection = $(event.currentTarget);
        setScannerTimeout(barcodeSelection);

        if (BarcodeChecker.isKitBarcodeValid(value)) {
          callback(value, element, controller);
        } else {
          errorCallback(value, element, controller);
        }
      };
    }
  }

  function kitScannedCallback(controller) {
    return function (value, template, controller) {
      controller.model
          .then(function(model){
            return model.setKitFromBarcode(value);
          })
          .fail(function (error) {
            PubSub.publish('s2.status.error', controller, error);
          })
          .then(function(model){
            PubSub.publish('s2.status.message', controller, {message:'Kit details validated/saved'});
            PubSub.publish("s2.step_controller.next_process", controller, {batch: model.batch});
            controller.selector().find('.barcodeInput').attr("disabled", "disabled");
          });
    }
  }

  function kitScannedErrorCallback(controller) {
    return function (errorText) {
      return function (value, template, controller) {
        PubSub.publish('s2.status.error', controller, {message:errorText});
      };
    };
  }

  function setScannerTimeout(barcodeSelection){
    setTimeout(function () {
      barcodeSelection.val('');
    }, 250);
  }

  var Controller = Object.create(Base);

  _.extend(Controller, {
    register: function(callback) {
      callback('kit_controller', function() {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function(owner, factory, config) {
      this.owner            = owner;
      this.config           = config;
      this.controllerFactory = factory;
      this.model            = Object.create(Model).init(this, config);
      return this;
    },

    setupController: function(setupData, selector) {
      var controller = this;
      controller.selector = selector;
      controller.model
          .then(function (model) {
            return model.setupModel(setupData);
          })
          .then(function(model){
          if(!model.batch.kit){
            controller.selector().html(_.template(kitPartialHtml)({}));
            controller.barcodeController = controller.controllerFactory.create('scan_barcode_controller', controller);
            controller.barcodeController.init({ type: 'Kit' });
            controller.selector()
                .find('.barcode')
                .append(controller.bindReturnKey( controller.barcodeController.renderView(), kitScannedCallback(controller), kitScannedErrorCallback(controller)('Barcode must be a 22 digit number.'), validationOnReturnKeyCallback(controller) ));
            controller.selector().find('.barcode input').focus();
          }
          });
      return controller;
    },

    focus: function () {
      var controller = this;
      controller.model
        .then(function (model) {
          if (model.batch.kit) {
            PubSub.publish("s2.step_controller.next_process", controller, {batch: model.batch});
          }
        });
    },

    release: function() {
      this.view.clear();
      return this;
    },

    initialController: function() {
      // Does nothing, for the moment!
      this.owner.childDone(this, 'disableBtn', this.config);
    },

    childDone: function(child, action, data) {
    }

  });

  return Controller;
});
