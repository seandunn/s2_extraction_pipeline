define(['config'
  , 'controllers/base_controller'
  , 'text!html_partials/_default_page.html'
  , 'default/default_model'
  , 'lib/util'
  , 'lib/pubsub'
  , 'lib/barcode_checker'
  , 'lib/promise_tracker'
], function (config, BaseController, defaultPagePartialHtml, Model, Util, PubSub, BarcodeChecker, PromiseTracker) {
  'use strict';

  function userBarcodeValidation(barcode)
  {
    return true;
  }
  
  function labwareBarcodeValidation(barcode)
  {
    return _.some(BarcodeChecker, function (validation) { return validation(barcode);});    
  }
  
  var userCallback = function(value, template, controller){
    var barcode = Util.pad(value);

    controller.userBCSubController.showProgress();

    PromiseTracker(controller.model.setUserFromBarcode(barcode))
      .fail(function (error) {
        PubSub.publish("error.status.s2", controller, error);
        controller.userBCSubController.hideProgress();
      })
      .afterThen(function(tracker) {
        controller.userBCSubController.updateProgress(tracker.thens_called_pc());
      })
      .then(function(){
        template.find("input").val(barcode);
        template.find("input").attr('disabled', true);

        controller.jquerySelectionForLabware().
          find("input").
          removeAttr('disabled').
          focus();
      });
  };

  var barcodeErrorCallback = function(errorText){
    return function(value, template, controller){
      PubSub.publish("error.status.s2", this, {message: errorText});
    };
  };

  var labwareCallback = function(value, template, controller){
    template.find("input").attr('disabled', true);
    template.find('.alert-error').addClass('hide');

    controller.labwareBCSubController.showProgress();

    if (value.match(/\d{12}/))
    {
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
      if (model.isValid()){
        controller.owner.childDone(controller, "login", model);
      } else {
        barcodeErrorCallback("Labware not found on system.")(undefined, template);
      }
    }
  };

  var DefaultController = Object.create(BaseController);

  $.extend(DefaultController, {
    register:function (callback) {
      callback('default', function (owner, factory, initData) {
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

      this.userBCSubController = this.controllerFactory.create('scan_barcode_controller', this).init({type:"user"});
      this.labwareBCSubController = this.controllerFactory.create('scan_barcode_controller', this).init({type:"tube"});

      this.jquerySelectionForUser = function () {
        return that.jquerySelection().find(".user_barcode");
      };

      this.jquerySelectionForLabware = function () {
        return that.jquerySelection().find(".labware_barcode");
      };

      this.renderView();
      this.jquerySelectionForUser().find("input").removeAttr('disabled').focus();
      this.jquerySelectionForLabware().find("input").attr('disabled', true);

      return this;
    },

    renderView: function () {
      this.jquerySelection().html(_.template(defaultPagePartialHtml)({}));
      var errorCallback = barcodeErrorCallback('Barcode must be a 13 digit number.');

      this.jquerySelectionForUser().append(
        this.bindReturnKey(this.userBCSubController.renderView(),
          userCallback, errorCallback, userBarcodeValidation));
      this.jquerySelectionForLabware().append(
        this.bindReturnKey(this.labwareBCSubController.renderView(),
          labwareCallback, errorCallback, labwareBarcodeValidation));

      return this;
    },

    release: function(){}

  });

  return DefaultController;
});
