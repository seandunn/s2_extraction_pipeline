define([
  'views/row_view'
  , 'controllers/base_controller'
], function (View, BaseController) {
  "use strict";

  /* Sample model input:
   *
   *{
   * "rowNum" : i,
   * "labware1" : {
   *   "uuid" : this.model[i],
   *   "expected_type" : "tube",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * },
   * "labware2" : {
   *   "expected_type" : "spin_column",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * },
   * "labware3" : {
   *   "expected_type" : "waste_tube",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * }
   *};
   */

  //TODO: check this declaration is ok
  var RowModel = Object.create(Object.prototype);

  $.extend(RowModel, {
    init:function (owner) {
      this.owner        = owner;
      this.labwares     = {};
      this.enabled      = true;
      return this;
    },
    setupModel:function (inputModel) {
      this.rowNum       = inputModel.rowNum;
      this.enabled      = inputModel.enabled;
      this.labwares     = inputModel;
      delete this.labwares.rowNum;
      delete this.labwares.enabled;
    },
    setResource:function (value) {
      this.resource = value
    }
  });

  var RowController = Object.create(BaseController);

  $.extend(RowController, {
    register: function(callback) {
      callback('row_controller', function(owner, factory) {
        return Object.create(RowController).init(owner, factory);
      });
    },

    init:function (owner, controllerFactory) {
      this.controllerFactory = controllerFactory;
      this.owner = owner;
      return this;
    },

    setupController:function (input_model, jquerySelection) {
      var controller = this;
      this.jquerySelection = jquerySelection;

      this.rowModel = Object.create(RowModel).init(this);
      this.rowModel.setupModel(input_model);

      this.currentView = new View(this, this.jquerySelection());

      // NOTE: sort() call is needed here to ensure labware1,labware2,labware3... ordering
      this.controllers = _.chain(this.rowModel.labwares).pairs().sort().map(function(nameToDetails) {
        var name = nameToDetails[0], details = nameToDetails[1];
        var subController = controller.controllerFactory.create('labware_controller', controller);
        subController.setupController(details, function() { return controller.jquerySelection().find('.' + name); });
        return subController;
      });

      this.currentView.renderView();
      this.controllers.each(function(p) { p.renderView(); });
    },


    release:function () {
      this.jquerySelection().release();
      return this;
    },

    setLabwareVisibility:function () {
      // Each labware controller is only enabled if it's previous is complete and it is not complete
      this.controllers.reduce(function(memo, controller) {
        if (!memo) {
          controller.labwareEnabled(false);
          return false
        }

        if (controller.isSpecial()) {
          controller.labwareEnabled(false);
          return true;
        } else if (controller.isComplete()) {
          controller.labwareEnabled(false);
          return true;
        } else {
          controller.labwareEnabled(true);
          return false;
        }
      }, this.rowModel.enabled).value();
    },
    focus: function() {
      var nextInput = this.editableControllers()
        .find(function(p) { return !p.isComplete(); })
        .value();

      if (nextInput) {
        nextInput.barcodeFocus();
      }
    },

    childDone:function (child, action, data) {
      var data = $.extend(data, { origin: child });

      if (action == "tube rendered") {
        this.owner.childDone(this, "tubeFinished", data);
      } else if (action === 'resourceUpdated') {
        if (this.isRowComplete() && (child === this.editableControllers().last().value())) {
          this.owner.childDone(this, "completed", data);
        }
      } else if (action == "labwareRendered") {
        this.setLabwareVisibility();
      } else if (action === 'removeLabware') {
        var eventPrefix = child.labwareModel.input ? 'input' : 'output';
        child.release();
        delete child.resource;
        delete child.resourceController;
        delete child.barcodeInputController;
        child.setupController(this.rowModel.labwares['labware' + (this.controllers.value().indexOf(child) + 1)], child.jquerySelection);
        child.renderView();
        this.owner.childDone(this, eventPrefix+'Removed', data);
      } else if (action === "barcodeScanned") {
        var eventPrefix = child.labwareModel.input ? 'input' : 'output';
        this.owner.childDone(this, eventPrefix+'BarcodeScanned', data);
        this.focus();
      }
    },

    editableControllers: function() {
      return this.controllers.compact().filter(function(controller) { 
        return !controller.isSpecial()  && !((!_.isUndefined(controller.labwareModel.resource)) && (controller.labwareModel.resource.tracked === false));
      });
    },

    isRowComplete: function() {
      return this.editableControllers().all(function(p) { return p.isComplete(); }).value();
    },

    lockRow: function() {
      this.controllers.each(function(controller) {
        controller.hideEditable();
      });
    },

    unlockRow: function(){
      this.controllers.each(function(controller) {
        controller.showEditable();
      });
      this.focus();
    },

    handleResources: function(callback) {
      callback.apply(null, this.editableControllers().map(function(p) { return p.labwareModel.resource; }).value());
    }
  });

  return RowController;
});
