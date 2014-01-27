define(["config"
  , "controllers/base_controller"
  , "text!html_partials/_default_page.html"
  , "default/default_model"
  , "lib/util"
  , "lib/pubsub"
  , "lib/barcode_checker"
  , "lib/promise_tracker"
], function (config, BaseController, defaultPagePartialHtml, Model, Util, PubSub, BarcodeChecker, PromiseTracker) {
  'use strict';


  function labwareBarcodeValidation(barcode) {
    return _.some(BarcodeChecker, function (validation) { return validation(barcode);});
  }

  var barcodeErrorCallback = function(errorText){
    return function(value, template, controller){
      PubSub.publish("error.status.s2", this, {message: errorText});
    };
  };

  var labwareCallback = function(value, template, controller){
    template.find("input").attr("disabled", true);
    template.find('.alert-error').addClass('hide');

    controller.labwareBCSubController.showProgress();

    if (value.match(/\d{12}/)) {
      value = Util.pad(value);
    }

    PromiseTracker(controller.model.setLabwareFromBarcode(value))
      .fail(function (error) {
        PubSub.publish("error.status.s2", controller, error);
        controller.labwareBCSubController.hideProgress();
      })
      .afterThen(function(tracker) {
        controller.labwareBCSubController.updateProgress(tracker.thens_called_pc());
      })
      .then(login)

    function login(model){
      if (model.labware !== undefined){
        controller.owner.updateModel(model);
      } else {
        barcodeErrorCallback("Labware not found on system.")(undefined, template);
      }
    }
  };

  var DefaultController = Object.create(BaseController);

  $.extend(DefaultController, {
    register:function (callback) {
      callback("default", function (owner, factory, initData) {
        return Object.create(DefaultController).init(owner, factory, initData);
      });
    },

    init:function (owner, controllerFactory) {
      this.controllerFactory = controllerFactory;
      this.owner = owner;
      return this;
    },

    setupController: function (setupData, jquerySelection) {
      var that = this;
      this.setupPlaceholder(jquerySelection);
      this.model = Object.create(Model).init(this);

      this.labwareBCSubController = this.controllerFactory.create("scan_barcode_controller", this).init({type:"Labware"});

      this.jquerySelectionForLabware = function () {
        return that.jquerySelection().find(".labware-barcode");
      };

      this.renderView();
      this.jquerySelectionForLabware().find("input").focus();

      return this;
    },

    renderView: function () {
      this.jquerySelection().html(_.template(defaultPagePartialHtml)({}));
      var errorCallback = barcodeErrorCallback('Barcode must be a 13 digit number.');

      this.jquerySelectionForLabware().append(
        this.bindReturnKey(this.labwareBCSubController.renderView(),
          labwareCallback, errorCallback, labwareBarcodeValidation));

      return this;
    },

    release: function(){}

  });

  return DefaultController;
});
