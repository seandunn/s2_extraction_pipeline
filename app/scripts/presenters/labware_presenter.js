define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/views/labware_view'
  , 'mapper/s2_root'
  , 'text!components/S2Mapper/test/json/unit/root.json'
  , 'text!components/S2Mapper/test/json/unit/tube.json'
  , 'text!components/S2Mapper/test/json/unit/tube_by_barcode.json'
], function (config, BasePresenter, LabwareView, S2Root, rootTestJson, dataTubeJSON, dataTubeFbyBCJSON) {

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

    setupPresenter:function (input_model, jquerySelection) {
      this.setupPlaceholder(jquerySelection);
      this.updateModel(input_model);
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
      if (this.model.resource) {
        type = this.model.resource.resourceType;
      }
      if (expectedType && type != expectedType) {
        //TODO: Set up error message here
      } else {
        if (type) {
          this.resourcePresenter = this.presenterFactory.createLabwareSubPresenter(this, type);
          this.view.setTitle(type);
        }
        if (!this.barcodeInputPresenter && this.model.display_barcode) {
          this.barcodeInputPresenter = this.presenterFactory.createScanBarcodePresenter(this);
        }
        this.setupSubModel();
      }
      return this;
    },

//    retrieveBarcode:function (data) {
//      var tube, root;
//      var barcode = data;
//      var that = this;
//      config.setupTest(rootTestJson);
//      S2Root.load().done(function (result) {
//        root = result;
//      })
//          .then(function () {
//            config.setupTest(dataTubeFbyBCJSON);
//            root.tubes.findByEan13Barcode(barcode).done(function (result) {
//                  if (result) {
//                    var type = result.resourceType;
//                    that.model = result.rawJson;
//                    that.uuid = result.uuid; //rawJson[type].uuid;
//                    that.setupSubPresenters(that.inputModel.expected_type);
////              that.owner.childDone(that, "login", dataForChildDone);
//                  } else {
//                    // todo : handle error
//                    debugger;
//                  }
//                }
//            ).fail(
//                function () {
//                  debugger;
//                }
//            );
//          });
//    },

    setupSubModel:function () {
      //if (this.model) {
      var that = this;
//      debugger;
      var data = {};
      if (this.model.resource) {
        // TODO: change the labware behaviour to get rid of the extra wrapping...
        // because the labware expect a resource of the following form:
        // resource == { tube:{...,resourceType:"tube", ...} }
        // we wrap the resource...
        data[this.model.resource.resourceType] = this.model.resource;
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


      this.setupSubPresenters(this.model.expected_type);
      this.setRemoveButtonVisibility(this.model.display_remove);
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
      this.model = undefined;
      this.resourcePresenter = undefined;
      this.barcodeInputPresenter = undefined;
      this.setupPresenter(this.inputModel, this.jquerySelection);
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
//        var action = action;
//        var data = data;
          this.resetLabware();
          this.owner.childDone(this, "labwareRemoved", {"uuid":this.uuid});
        }
      }
      else if (action == "tube rendered") {
        this.owner.childDone(this, action, child.getAliquotType());
      }
      else if (action == 'barcodeScanned') {
//        this.retrieveBarcode(data.BC);
        this.owner.childDone(this, 'barcodeScanned', {"BC":data.BC});
      }
    }
  });

  return LabwarePresenter;

});
