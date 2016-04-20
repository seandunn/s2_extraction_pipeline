//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define(["controllers/base_controller",
  "views/labware_view",
  "lib/pubsub",
  "lib/barcode_checker",
  "lib/util",
  "labware/presenter",
  "models/labware_model"
], function (BaseController, LabwareView, PubSub, BarcodeChecker, Util, LabwarePresenter, LabwareModel) {
  "use strict";

  var LabwareController = Object.create(BaseController);

  $.extend(LabwareController, {
    register: function(callback) {
      callback("labware_controller", function(owner, factory) {
        return Object.create(LabwareController).init(owner, factory);
      });
    },

    init: function (owner, controllerFactory) {
      this.owner = owner;
      this.controllerFactory = controllerFactory;
      return this;
    },

    setupController: function (setupData, jquerySelection) {
      this.setupPlaceholder(jquerySelection);
      this.labwareModel = Object.create(LabwareModel).init(this, setupData);

      this.labwareModel.on("resourceUpdated", _.bind(function() {
          this.setupView();
          this.renderView();
          this.emit("resourceUpdated");
      }, this));
      
      this.setupView();
      this.setupSubControllers();
      return this;
    },

    setupPlaceholder: function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    setupView: function () {
      this.view = new LabwareView(this, this.jquerySelection);
      return this;
    },

    updateModel: function (newResource, presentationHandler) {
      this.labwareModel.setResource(newResource, presentationHandler || LabwarePresenter.presentResource)
      return this;
    },
    setupSubControllers: function () {
      var type;
      if (!this.resourceController) {
        type = this.labwareModel.expected_type;
      }
      if (this.labwareModel.resource) {
        type = this.labwareModel.resource.resourceType;
      }
      if (this.labwareModel.expected_type && type != this.labwareModel.expected_type) {
        throw "type declaration mismatch! Check the type is correctly entered in the pipeline config for this page.";
      } else {
        if (this.labwareModel.displayLabware()) {
          this.resourceController = this.controllerFactory.createLabwareSubController(this, type);
        }
        if (!this.barcodeInputController && this.labwareModel.display_barcode && !this.isSpecial()) {
          this.barcodeInputController = this.controllerFactory.create("scan_barcode_controller", this);
        }
        this.setupSubModel();
      }
      return this;
    },

    setupSubModel: function () {
      var that = this;
      var data = {};
      if (this.labwareModel.resource) {
        // TODO: change the labware behaviour to get rid of the extra wrapping...
        // because the labware expect a resource of the following form:
        // resource == { tube:{...,resourceType:"tube", ...} }
        // we wrap the resource...
        data[this.labwareModel.resource.resourceType] = this.labwareModel.resource;
      }
      if (this.resourceController) {
        this.labwareModel.displayResource(function() {
          return that.jquerySelection().find("div.resource");
        });
      }
      if (this.barcodeInputController) {
        this.barcodeInputController.init(data, function () {
          return that.jquerySelection().find("div.barcodeScanner");
        });
      }
    },

    renderView: function () {
      this.view.clear();
      this.setupSubModel();

      this.view.renderView(this.model);

      if (this.resourceController) {
        this.resourceController.renderView();
      }

      if (this.barcodeInputController) {
        var labwareCallback = function(value, template, controller){
          var statusPromise = new $.Deferred();
          if (value.match(/\d{12}/))
          {
            value = Util.pad(value);
          }
          this.emit("barcodeScanned", {
            modelName: controller.labwareModel.expected_type.pluralize(),
            BC:        value,
            typeBarcode:   controller.labwareModel.input ? 'input' : 'output',
            origin: controller,
            promise: statusPromise
          });
          PubSub.publish("barcode_scanned.labware.s2", controller, {
            modelName: controller.labwareModel.expected_type.pluralize(),
            BC:        value
          });
          return statusPromise;
        };
        this.jquerySelection().append(
          this.bindReturnKey(this.barcodeInputController.renderView(),
              labwareCallback,
              barcodeErrorCallback("The barcode is not valid."),
              validationOnReturnKeyCallback(this, this.labwareModel.validation, this.labwareModel.barcodePrefixes))
        );
      }

      if (!(this.labwareModel.display_remove && !this.isSpecial())) {
        this.view.hideRemoveButton();
      }

      this.view.setTitle(this.labwareModel.title);
      this.owner.childDone(this, "labwareRendered", {});
    },

    isSpecial: function() {
      return specialType(this.labwareModel.expected_type) || isUntracked(this.labwareModel);

      function isUntracked(model) {
        return !_.isUndefined(model.resource) && (model.tracked === false);
      }
    },

    isComplete: function () {
      return !this.isSpecial() && this.labwareModel.resource;
    },

    labwareEnabled: function (isEnabled) {
      this.view.labwareEnabled(isEnabled);
      return this;
    },

    release: function () {
      if (this.view) {
        this.view.clear();
      }
    },

    childDone: function (child, action, data) {
      if (child === this.view) {
        this.viewDone(child, action, data);
      } else if (child === this.labwareModel) {
        this.modelDone(child, action, data);
      } else if (child === this.barcodeInputController) {
        this.barcodeInputDone(child, action, data);
      }
    },
    viewDone: function(child, action, data) {
      if (action == "labwareRemoved") {
        this.owner.childDone(this, "removeLabware", { resource: this.labwareModel.resource });
        PubSub.publish("removed.labware.s2", this, {
          resource:  this.labwareModel.resource
        });
      }
    },

    barcodeInputDone: function(child, action, data) {
      if (action == "barcodeScanned") {
        this.owner.childDone(this, "barcodeScanned", {
          modelName: this.labwareModel.expected_type.pluralize(),
          BC:        data.barcode
        });
      }
    },

    barcodeFocus: function() {
      this.jquerySelection().find("input").focus();
    },

    hideEditable: function() {
      this.view.hideBarcodeEntry();
      this.view.hideRemoveButton();
    },

    showEditable: function() {
      this.view.showBarcodeEntry();
      this.view.showRemoveButton();
    },

    displayErrorMessage: function (message) {
      PubSub.publish("error.status.s2", this, {message: message});
    },

    onBarcodeScanned: function() {
      this.owner.childDone("barcodeScanned");
    }
  });

  return LabwareController;

  function specialType(type) {
    return _.contains(["qia_cube", "centrifuge"], type);
  }

  function barcodeErrorCallback(errorText){
    return function(value, template, controller){
      PubSub.publish("error.status.s2", controller, {message: errorText});
    };
  }

  // sets a timeout after which the input is cleared
  // this happens so that if many scans are made in a short time,
  // unwanted calls won"t go through
  function setScannedTimeout (barcodeSelection) {
    setTimeout(function () {
      barcodeSelection.val("");
    }, 250);
  }
  
  function validationOnReturnKeyCallback (controller, type, barcodePrefixes) {
    var validation = (type === "2D_tube")? BarcodeChecker.is2DTubeBarcodeValid : 
      BarcodeChecker.isBarcodeValid;
    return function(value) {
      return validation(value, barcodePrefixes);
    };
  }
});
