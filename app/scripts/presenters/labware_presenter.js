define(['extraction_pipeline/views/labware_view', 'mapper/s2_resource_factory', 'config'], function (LabwareView, S2Factory, config) {

  var LabwarePresenter = function (owner, presenterFactory) {
    this.model = undefined;
    this.owner = owner;
    this.presenterFactory = presenterFactory;
    this.resourcePresenter = undefined;
    this.barcodeInputPresenter = undefined;
  };

  LabwarePresenter.prototype.setupPresenter = function (input_model, jquerySelection) {
    /*
     * input_model = {
     *   uuid: "1234567890" // the uuid used to locate the resource
     * }
     *
     * */

    this.setupPlaceholder(jquerySelection);
    this.updateModel(input_model);
    return this;
  };

  LabwarePresenter.prototype.setupPlaceholder = function (jquerySelection) {
    this.jquerySelection = jquerySelection;
    return this;
  };

  LabwarePresenter.prototype.setupView = function () {
    this.view = new LabwareView(this, this.jquerySelection);
    return this;
  };

  LabwarePresenter.prototype.updateModel = function (model) {

    if (model && model.hasOwnProperty('uuid')) {
    var that = this;
    var root, rsc;

    config.setTestJson('dna_only_extraction');
    config.currentStage = 'stage1';
    var rscPromise = new S2Factory({uuid:model.uuid});

    rscPromise.done(function(result){rsc = result;}).then(
      function () {
        that.model = rsc.rawJson;

        if (model.hasOwnProperty('expected_type')) {
          if (!rsc.rawJson.hasOwnProperty(model.expected_type)) {
            that.model = undefined;
          }
        }

        that.setupView();
        that.renderView();
        that.setupSubPresenters(model.expected_type);
//        that.owner.childDone(that, "Found equipment", model.uuid);
      }
    );

    } else {
      var expectedType = undefined;
      if (model) {
        expectedType = model.expected_type;
      }
      this.setupView();
      this.renderView();
      this.setupSubPresenters(expectedType);
    }

    return this;
  };

  LabwarePresenter.prototype.setupSubPresenters = function (expectedType) {
    if (!this.resourcePresenter) {
      var type = expectedType;

      if (this.model) {
        type = Object.keys(this.model)[0];

      }

      if (type) {
        this.resourcePresenter = this.presenterFactory.createLabwareSubPresenter(this, type);
      }
    }
    if (!this.barcodeInputPresenter && !this.model && !this.specialType(type)) {
      this.barcodeInputPresenter = this.presenterFactory.createScanBarcodePresenter(this);
    }
    this.setupSubModel();
    return this;
  };

  LabwarePresenter.prototype.setupSubModel = function () {
    //if (this.model) {
    var that = this;
//      debugger;
    var data = {};
    if (this.model) {
      data = this.model;
    }

    var resourceSelector = function () {
      return that.jquerySelection().find("div.resource")};

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

  };

  LabwarePresenter.prototype.renderView = function () {
    console.log("### renderView", this.model);

    if (this.view) {
      this.view.renderView(this.model);
    }
    if (this.resourcePresenter) {
      this.resourcePresenter.renderView();
    }
    if (this.barcodeInputPresenter) {
      this.barcodeInputPresenter.renderView();
    }

  };

  LabwarePresenter.prototype.specialType = function(type) {
    var specialType = false;
    var typesList = ['waste_tube', 'qia_cube', 'centrifuge'];

    if (type) {
      if (typesList.indexOf(type) > -1) {
        specialType = true;
      }
    }

    return specialType;
  }

  LabwarePresenter.prototype.release = function () {
    if (this.view) {
      this.view.clear();
    }
  };

  /*
   TODO : update data schema
   action : "removeTube" -> data == { ?? }
   */
  LabwarePresenter.prototype.childDone = function (child, action, data) {
    if (child === this.view) {
      if (action == "removeTube") {
//        var action = action;
//        var data = data;
        this.owner.childDone(this, action, data);
      }
    }
    else if (data.hasOwnProperty('tube')) {
      this.owner.childDone(child, action, child.getAliquotType());
    }
  };

  return LabwarePresenter;

});
