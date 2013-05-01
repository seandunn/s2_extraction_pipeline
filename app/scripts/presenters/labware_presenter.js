define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/views/labware_view'
  , 'mapper/s2_root'
], function (config, BasePresenter, LabwareView, S2Root) {

  var LabwareModel = Object.create(null);
  $.extend(LabwareModel, {
    init:function (owner) {
      this.owner = owner;
      this.resource = undefined;
      this.display_remove = undefined;
      this.display_barcode = undefined;
      this.display_labware = undefined;
      this.expected_type = undefined;
      this.input = undefined;
      return this;
    },
    reset:function () {
      this.resource = undefined;
    },
    setResource:function (value) {
      this.resource = value
    },
    setDisplayRemove:function (value) {
      this.display_remove = value
    },
    setDisplayBarcode:function (value) {
      this.display_barcode = value
    },
    setDisplayLabware: function(value) {
      this.display_labware = value;
    },
    setExpectedType:function (value) {
      this.expected_type = value
    },
    setInput: function(value) {
      this.input = value;
    },
    displayLabware: function() {
      return this.display_labware === undefined ? true : this.display_labware;
    }
  });

  var LabwarePresenter = Object.create(BasePresenter);

  $.extend(LabwarePresenter, {
    register: function(callback) {
      callback('labware_presenter', function(owner, factory) {
        return Object.create(LabwarePresenter).init(owner, factory);
      });
    },

    init:function (owner, presenterFactory) {
      this.owner = owner;
      this.presenterFactory = presenterFactory;
      return this;
    },
    setupPresenter:function (setupData, jquerySelection) {
      this.setupPlaceholder(jquerySelection);
      this.labwareModel = Object.create(LabwareModel).init(this);
      if (setupData) {
        this.labwareModel.setResource(setupData.resource);
        this.labwareModel.setDisplayRemove(setupData.display_remove);
        this.labwareModel.setDisplayBarcode(setupData.display_barcode);
        this.labwareModel.setDisplayLabware(setupData.display_labware);
        this.labwareModel.setExpectedType(setupData.expected_type);
        this.labwareModel.setInput(setupData.input);
      }
      this.setupView();
      this.setupSubPresenters();
      return this;
    },

    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    setupView:function () {
      this.view = new LabwareView(this, this.jquerySelection);
      return this;
    },

    updateModel:function (newData) {
      this.labwareModel.setResource(newData);
      this.childDone(this.labwareModel, 'resourceUpdated', {});
      return this;
    },

    setRemoveButtonVisibility:function (displayRemove) {
      if (!displayRemove) {
        this.view.hideRemoveButton();
      }
    },

    setupSubPresenters:function () {
      if (!this.resourcePresenter) {
        var type = this.labwareModel.expected_type;
      }
      if (this.labwareModel.resource) {
        type = this.labwareModel.resource.resourceType;
      }
      if (this.labwareModel.expected_type && type != this.labwareModel.expected_type) {
        //TODO: Set up error message here
      } else {
        if (this.labwareModel.displayLabware()) {
          this.resourcePresenter = this.presenterFactory.createLabwareSubPresenter(this, type);
          this.view.setTitle(type);
        }
        if (!this.barcodeInputPresenter && this.labwareModel.display_barcode && !this.isSpecial()) {
          this.barcodeInputPresenter = this.presenterFactory.create('scan_barcode_presenter', this);
        }
        this.setupSubModel();
      }
      return this;
    },

    setupSubModel:function () {
      //if (this.model) {
      var that = this;

      var data = {};
      if (this.labwareModel.resource) {
        // TODO: change the labware behaviour to get rid of the extra wrapping...
        // because the labware expect a resource of the following form:
        // resource == { tube:{...,resourceType:"tube", ...} }
        // we wrap the resource...
        data[this.labwareModel.resource.resourceType] = this.labwareModel.resource;
      }

      var resourceSelector = function () {
        return that.jquerySelection().find("div.resource")
      };

      if (this.resourcePresenter) {
        this.resourcePresenter.setupPresenter(data, resourceSelector);
      }

      if (this.barcodeInputPresenter) {
        this.barcodeInputPresenter.setupPresenter(data, function () {
          return that.jquerySelection().find("div.barcodeScanner")
        });
      }
    },

    renderView:function () {
      this.release();
//      this.resourcePresenter = undefined;
//      this.barcodeInputPresenter = undefined;

//      this.setupSubPresenters(this.labwareModel.expected_type);

      this.setupSubModel();

      if (this.view) {
        this.view.renderView(this.model);
      }
      if (this.resourcePresenter) {
        this.resourcePresenter.renderView();
      }
      if (this.barcodeInputPresenter) {
        this.barcodeInputPresenter.renderView();
      }

      this.setRemoveButtonVisibility(this.labwareModel.display_remove && !this.isSpecial());
      this.owner.childDone(this, "labwareRendered", {});
    },

    resetLabware:function () {
      this.release();
      this.labwareModel.reset();// = undefined;
      this.resourcePresenter = undefined;
      this.barcodeInputPresenter = undefined;
      this.setupPresenter(this.labwareModel, this.jquerySelection);
      this.renderView();
    },

    isSpecial: function() {
      return specialType(this.labwareModel.expected_type);
    },
    isComplete:function () {
      return !this.isSpecial() && this.labwareModel.resource;
    },

    labwareEnabled:function (isEnabled) {
      this.view.labwareEnabled(isEnabled);
      return this;
    },

    release:function () {
      if (this.view) {
        this.view.clear();
      }
    },

    /*
     TODO : update data schema
     action : "removeTube" -> data == { ?? }
     */
    childDone:function (child, action, data) {
      if (child === this.view) {
        this.viewDone(child, action, data);
      } else if (child === this.labwareModel) {
        this.modelDone(child, action, data);
      } else if (child === this.barcodeInputPresenter) {
        this.barcodeInputDone(child, action, data);
      }
    },
    viewDone: function(child, action, data) {
      if (action == "labwareRemoved") {
        this.owner.childDone(this, "removeLabware", { resource: this.labwareModel.resource });
        this.resetLabware();
      }
    },
    barcodeInputDone: function(child, action, data) {
      if (action == 'barcodeScanned') {
        this.owner.childDone(this, 'barcodeScanned', {
          modelName: this.labwareModel.expected_type.pluralize(),
          BC:        data.BC
        });
      }
    },
    modelDone: function(child, action, data) {
      if (action === 'resourceUpdated') {
        this.setupView();
        this.renderView();
        this.owner.childDone(this, 'resourceUpdated', {});
      }
    },

    barcodeFocus:function() {
      if (this.barcodeInputPresenter) {
        this.barcodeInputPresenter.focus();
      }
    },
    hideEditable: function() {
      this.view.hideBarcodeEntry();
      this.view.hideRemoveButton();
    },
    displayErrorMessage:function (message) {
      this.barcodeInputPresenter.displayErrorMessage(message);
    }

  });

  return LabwarePresenter;

  function specialType(type) {
    return _.contains(['waste_tube', 'qia_cube', 'centrifuge'], type);
  }
});
