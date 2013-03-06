define(['extraction_pipeline/views/labware_view'], function (LabwareView) {

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
    this.setupView();
    this.renderView();

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
    this.model = model;
    this.setupSubPresenters();
    return this;
  };

  LabwarePresenter.prototype.setupSubPresenters = function () {
    if (!this.resourcePresenter) {
      this.resourcePresenter = this.presenterFactory.createTubePresenter(this);
    }
    if (!this.barcodeInputPresenter) {
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
      data = {
        uuid:this.model.uuid
      };
    }

    this.resourcePresenter.setupPresenter(data, function () {
      return that.jquerySelection().find("div.resource");
    });
    this.barcodeInputPresenter.setupPresenter(data, function () {
      return that.jquerySelection().find("div.barcodeScanner");
    });
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
  };

  return LabwarePresenter;

});
