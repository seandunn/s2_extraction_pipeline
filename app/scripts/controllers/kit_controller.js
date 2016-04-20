//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  'controllers/base_controller',
  'text!html_partials/_kit.html',
  'models/kit_model',
  'lib/pubsub',
  'lib/barcode_checker',
  'lib/util',
  'lib/promise_tracker'
], function(Base, kitPartialHtml, Model, PubSub, BarcodeChecker, Util, PromiseTracker) {
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
      controller.barcodeController.showProgress();

      PromiseTracker(controller.model)
          .afterThen(function(tracker) {
            controller.barcodeController.updateProgress(tracker.thens_called_pc());
          })
          .then(function(model){
            return model.setKitFromBarcode(value);
          })
          .fail(function (error) {
            PubSub.publish("error.status.s2", controller, error);
            controller.barcodeController.hideProgress();
          })
          .then(function(model){
            PubSub.publish("message.status.s2", controller, {message:'Kit details validated/saved'});
            PubSub.publish("next_process.step_controller.s2", controller, {batch: model.batch});
            controller.selector().find('.barcodeInput').attr("disabled", "disabled");
          });
    }
  }

  function kitScannedErrorCallback(controller) {
    return function (errorText) {
      return function (value, template, controller) {
        PubSub.publish("error.status.s2", controller, {message:errorText});
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

            controller.barcodeController.init({
              type: 'Kit',
              icon: 'icon-tint'
            });

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
            PubSub.publish("next_process.step_controller.s2", controller, {batch: model.batch});
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
