define(['extraction_pipeline/models/scan_barcode_model', 'extraction_pipeline/views/scan_barcode_view'], function(ScanBarcodeModel, ScanBarcodeView) {

  var ScanBarcodePresenter = function (owner, presenterFactory) {
    this.owner = owner;
    this.presenterFactory = presenterFactory;
    this.view = undefined;
    this.model = undefined;
    return this;
  };

  ScanBarcodePresenter.prototype.setupPresenter = function (input_model, jquerySelection) {
    this.setupPlaceholder(jquerySelection);

    this.updateModel(input_model); // we do it before the setup view, because we know everything... no need for a tmp view
    this.setupView();
    this.renderView();
    return this;
  };

  ScanBarcodePresenter.prototype.setupPlaceholder = function (jquerySelection) {
    this.jquerySelection = jquerySelection;
    return this;
  };


  ScanBarcodePresenter.prototype.updateModel = function (input_model) {
    if (!this.model) {
      this.model = new ScanBarcodeModel(input_model);
    }
    return this;
  };

  ScanBarcodePresenter.prototype.setupSubPresenters = function () {
    // check with this.model for the needed subpresenters...
    return this;
  };

  ScanBarcodePresenter.prototype.setupSubModel = function (model, jquerySelection) {
    return this;
  };

  ScanBarcodePresenter.prototype.setupView = function () {
    this.view = new ScanBarcodeView(this, this.jquerySelection);
  };

  ScanBarcodePresenter.prototype.renderView = function () {
    if (this.view) {
      this.view.render(this.model);
    }
  };

  ScanBarcodePresenter.prototype.release = function () {
    if (this.view) {
      this.view.clear();
    }
  };

  ScanBarcodePresenter.prototype.childDone = function (presenter, action, data) {

    if (action == "barcodeScanned") {
      this.handleBarcode(data);
    } else if (action === "parentError") {
      this.model.customError = (data && data.message) ? data.message : "Unknown error";
      this.model.busy = false;
      this.model.barcode = "";
      this.renderView();
    }
  };

  ScanBarcodePresenter.prototype.handleBarcode = function (barcode) {
    this.model.barcode = barcode;
    var dataForBarcodeScanned = {
      BC:barcode
    };
    this.owner.childDone(this, "barcodeScanned", dataForBarcodeScanned);

//    if (this.model.isValid()) {
//      this.model.busy = true;
//      this.renderView();
//      this.owner.childDone(this, "barcodeScanned", barcode);
//    }
//    else {
//      this.renderView();
//    }
  };

  ScanBarcodePresenter.prototype.displayErrorMessage = function(message) {
    this.view.displayErrorMessage(message);
  };

//  ScanBarcodePresenter.prototype.validateBarcode = function (barcode) {
//    return false;
//  };

  return ScanBarcodePresenter;

});
