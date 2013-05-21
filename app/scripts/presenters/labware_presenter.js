define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/views/labware_view'
  , 'extraction_pipeline/lib/pubsub'
  , 'extraction_pipeline/lib/barcode_checker'
], function (config, BasePresenter, LabwareView, PubSub, BarcodeChecker) {

  var defaultTitles = {
    tube: 'Tube',
    spin_column: 'Spin Column',
    waste_tube: 'Waste Tube'
  };

  var LabwareModel = Object.create(null);
  $.extend(LabwareModel, {
    init: function (owner, setupData) {
      this.owner = owner;
      $.extend(this, setupData);

      return this;
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

    init: function (owner, presenterFactory) {
      this.owner = owner;
      this.presenterFactory = presenterFactory;
      return this;
    },
    setupPresenter: function (setupData, jquerySelection) {
      this.setupPlaceholder(jquerySelection);
      this.labwareModel = Object.create(LabwareModel).init(this, setupData);

      this.setupView();
      this.setupSubPresenters();
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

    updateModel: function (newResource) {
      this.labwareModel.resource = newResource;
      this.childDone(this.labwareModel, 'resourceUpdated', {});
      return this;
    },

    setupSubPresenters: function () {
      if (!this.resourcePresenter) {
        var type = this.labwareModel.expected_type;
      }
      if (this.labwareModel.resource) {
        type = this.labwareModel.resource.resourceType;
      }
      if (this.labwareModel.expected_type && type != this.labwareModel.expected_type) {
        throw "type declaration mismatch! Check the type is correctly entered in the pipeline config for this page.";
      } else {
        if (this.labwareModel.displayLabware()) {
          this.resourcePresenter = this.presenterFactory.createLabwareSubPresenter(this, type);
        }
        if (!this.barcodeInputPresenter && this.labwareModel.display_barcode && !this.isSpecial()) {
          this.barcodeInputPresenter = this.presenterFactory.create('scan_barcode_presenter', this);
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
      var resourceSelector = function () {
        return that.jquerySelection().find("div.resource")
      };
      if (this.resourcePresenter) {
        this.resourcePresenter.setupPresenter(data, resourceSelector);
      }
      if (this.barcodeInputPresenter) {
        this.barcodeInputPresenter.init(data, function () {
          return that.jquerySelection().find("div.barcodeScanner")
        });
      }
    },

    renderView: function () {
      this.view.clear();
      this.setupSubModel();

      this.view.renderView(this.model);

      if (this.resourcePresenter) {
        this.resourcePresenter.renderView();
      }

      if (this.barcodeInputPresenter) {
        var labwareCallback = function(event, template, presenter){
          presenter.owner.childDone(presenter, 'barcodeScanned', {
            modelName: presenter.labwareModel.expected_type.pluralize(),
            BC:        event.currentTarget.value
          });
          PubSub.publish("s2.labware.barcode_scanned", presenter, {
            modelName: presenter.labwareModel.expected_type.pluralize(),
            BC:        event.currentTarget.value
          });
        };
        this.jquerySelection().append(
          this.bindReturnKey(this.barcodeInputPresenter.renderView(),
              labwareCallback,
              barcodeErrorCallback('The barcode is not valid.'),
              validationOnReturnKeyCallback(this, this.labwareModel.validation))
        );
      }

      if (!(this.labwareModel.display_remove && !this.isSpecial())) {
        this.view.hideRemoveButton();
      }

      this.view.setTitle(this.labwareModel.title || defaultTitles[this.labwareModel.expected_type]);
      this.owner.childDone(this, "labwareRendered", {});
    },

    isSpecial: function() {
      return specialType(this.labwareModel.expected_type);
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
      } else if (child === this.barcodeInputPresenter) {
        this.barcodeInputDone(child, action, data);
      }
    },
    viewDone: function(child, action, data) {
      if (action == "labwareRemoved") {
        this.owner.childDone(this, "removeLabware", { resource: this.labwareModel.resource });
        PubSub.publish("s2.labware.removed", this, {
          resource:  this.labwareModel.resource
        });
        this.release();
        delete this.resource;
        delete this.resourcePresenter;
        delete this.barcodeInputPresenter;
        this.setupPresenter(this.labwareModel, this.jquerySelection);
        this.renderView();
      }
    },

    barcodeInputDone: function(child, action, data) {
      if (action == 'barcodeScanned') {
        this.owner.childDone(this, 'barcodeScanned', {
          modelName: this.labwareModel.expected_type.pluralize(),
          BC:        data.barcode
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

    barcodeFocus: function() {
      this.jquerySelection().find('input').focus();
    },

    hideEditable: function() {
      this.view.hideBarcodeEntry();
      this.view.hideRemoveButton();
    },

    displayErrorMessage: function (message) {
      var selection = this.jquerySelection().find('.alert-error');
      var text = 'Error!';
      text += message;
      var tmp = $('<h4/>', {
        class: 'alert-heading',
        text: text
      });
      tmp.appendTo(selection.empty());
      selection.css('display', 'block');
    }

  });

  return LabwarePresenter;

  function specialType(type) {
    return _.contains(['waste_tube', 'qia_cube', 'centrifuge'], type);
  }

  function barcodeErrorCallback(errorText){
    var errorHtml = function(errorText){
      return $("<h4/>", {class: "alert-heading", text: errorText});
    };
    return function(event, template, presenter){
      template.
          find('.alert-error').
          html(errorHtml(errorText)).
          removeClass('hide');
      template.
          find('input').
          removeAttr('disabled');
    };
  }

  function validationOnReturnKeyCallback (presenter, type) {
    var validationCallBack ;
    switch(type){
      case "2D_tube":
        validationCallBack = BarcodeChecker.is2DTubeBarcodeValid;
        break;
      case "1D_tube":
      default:
        validationCallBack = BarcodeChecker.isBarcodeValid;
    }

    return function (element, callback, errorCallback) {
      // validation of the barcode only on return key
      return function (event) {
        if (event.which !== 13) return;

        if (validationCallBack(event.currentTarget.value)) {
          callback(event, element, presenter);
        } else {
          errorCallback(event, element, presenter);
        }
      };
    }
  }


});
