define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/views/labware_view'
  , 'mapper/s2_root'
  , 'text!components/S2Mapper/test/json/unit/root.json'
  , 'text!components/S2Mapper/test/json/unit/tube.json'
  , 'text!components/S2Mapper/test/json/unit/tube_by_barcode.json'
], function (config, BasePresenter, LabwareView, S2Root, rootTestJson, dataTubeJSON, dataTubeFbyBCJSON) {

  var LabwareModel = Object.create(null);
  $.extend(LabwareModel, {
    init:function (owner) {
      this.owner = owner;
      this.resource = undefined;
      this.display_remove = undefined;
      this.display_barcode = undefined;
      this.expected_type = undefined;
      return this;
    },
    reset:function(){
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
    }    ,
    setExpectedType:function (value) {
      this.expected_type = value
    }
  });

  var LabwarePresenter = Object.create(BasePresenter);

//  var LabwarePresenter = function (owner, presenterFactory) {
//    this.model = undefined;
//    this.uuid = undefined;
//    this.owner = owner;
//    this.inputModel = undefined;
//    this.presenterFactory = presenterFactory;
//    this.resourcePresenter = undefined;
//    this.barcodeInputPresenter = undefined;
//  };
  $.extend(LabwarePresenter, {

    setupPresenter:function (setupData, jquerySelection) {
      this.setupPlaceholder(jquerySelection);
      this.labwareModel = Object.create(LabwareModel).init(this);
      if (setupData) {
        this.labwareModel.setResource(setupData.resource);
        this.labwareModel.setDisplayRemove(setupData.display_remove);
        this.labwareModel.setDisplayBarcode(setupData.display_barcode);
        this.labwareModel.setExpectedType(setupData.expected_type);
      }
      //this.updateModel(input_model);
      this.setupView();
      this.setupSubPresenters();
//      this.renderView();
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

      if (!this.model) this.model = {};

      $.extend(this.model, newData);

//      if (model && model.hasOwnProperty('resource')) {
//        this.inputModel = model;
//      }


//        if (!this.model.hasOwnProperty('resource') && this.model.hasOwnProperty('uuid')) {
//
//          config.setupTest(rootTestJson);
//          S2Root.load().done(function (result) {
//            root = result;
//          })
//              .then(function () {
//                config.setupTest(dataTubeJSON);
//                root.find(model.uuid).done(function (rsc) {
//                      that.model = rsc.rawJson;
//                      that.uuid = model.uuid;
//                      if (model.hasOwnProperty('expected_type')) {
//                        if (!rsc.rawJson.hasOwnProperty(model.expected_type)) {
//                          that.model = undefined;
//                        }
//                      }
//                    }
//                );
//                that.setupView();
//                that.renderView();
//  //        that.owner.childDone(that, "Found equipment", model.uuid);
//              }
//          );
//        }
//      } else {
//          var expectedType = undefined;
//          if (model) {
//            expectedType = model.expected_type;
//          }
//          this.setupView();
//          this.renderView();
//
//      }
      this.setupView();
      this.renderView();
      return this;
    },

  setRemoveButtonVisibility:function (displayRemove) {
    if (!displayRemove) {
      this.view.hideRemoveButton();
    }
  },

    setupSubPresenters:function (expectedType) {
      if (!this.resourcePresenter) {
        var type = expectedType;
      }
      if (this.labwareModel.resource) {
        type = this.labwareModel.resource.resourceType;
      }
      if (this.labwareModel.expectedType && type != this.labwareModel.expectedType) {
        //TODO: Set up error message here
      } else {
        if (type) {
          this.resourcePresenter = this.presenterFactory.createLabwareSubPresenter(this, type);
          this.view.setTitle(type);
        }
        if (!this.barcodeInputPresenter && this.labwareModel.display_barcode) {
          this.barcodeInputPresenter = this.presenterFactory.createScanBarcodePresenter(this);
        }
        this.setupSubModel();
      }
      return this;
    },

    setupSubModel:function () {
      //if (this.model) {
      var that = this;
//      debugger;
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
//      console.log(">>>>> ",this.tubePresenter);

      //  }
      // equivalent to the call to tubePresenter.setupPresenter()
//      this.tubePresenter.setupView(function () {
//        console.log(that.jquerySelection());
//        return that.jquerySelection().find("div.placeholder");
//      });

    },

    renderView:function () {
      this.release();
      this.resourcePresenter = undefined;
      this.barcodeInputPresenter = undefined;

      if (this.view) {
        this.view.renderView(this.model);
      }
      if (this.resourcePresenter) {
        this.resourcePresenter.renderView();
      }
      if (this.barcodeInputPresenter) {
        this.barcodeInputPresenter.renderView();
      }

      this.setupSubPresenters(this.labwareModel.expected_type);
      this.setRemoveButtonVisibility(this.labwareModel.display_remove);
    },

    specialType:function (type) {
      var specialType = false;
      var typesList = ['waste_tube', 'qia_cube', 'centrifuge'];

      if (type) {
        if (typesList.indexOf(type) > -1) {
          specialType = true;
        }
      }

      return specialType;
    },

    resetLabware:function () {
      this.release();
      this.labwareModel.reset();// = undefined;
      this.resourcePresenter = undefined;
      this.barcodeInputPresenter = undefined;
      this.setupPresenter(this.labwareModel, this.jquerySelection);
    },

  isComplete:function() {
    var complete = true;

      // If the labware module requires input but there is no model to populate it, we can assume it's incomplete
      if (this.labwareModel.display_barcode && this.labwareModel.display_remove && !this.model) {
        complete = false;
      }

    return complete;
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
        if (action == "labwareRemoved") {
          var dataForOwner = {
            "uuid":this.labwareModel.resource.uuid
          };
          this.owner.childDone(this, "removeLabware", dataForOwner);
        }
      }
//      else if (action == "tube rendered") {
//        //this.owner.childDone(this, action, child.getAliquotType());
//      }
      else if (action == 'barcodeScanned') {
        this.owner.childDone(this, 'barcodeScanned', {"BC":data.BC});

      }    
  },

  displayErrorMessage:function(message) {
    this.barcodeInputPresenter.displayErrorMessage(message);
  }
  
  });

  return LabwarePresenter;

});
