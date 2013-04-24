define(['extraction_pipeline/models/scan_barcode_model', 'extraction_pipeline/views/scan_barcode_view'], function (Model, View) {
  'use strict';

  var ScanBarcodePresenter = function (owner, presenterFactory) {
    this.owner = owner;
    this.presenterFactory = presenterFactory;
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
    this.model = new Model(input_model);
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
    this.view = new View(this, this.jquerySelection);
  };

  ScanBarcodePresenter.prototype.renderView = function () {
    this.view.render(this.model);
  };

  ScanBarcodePresenter.prototype.release = function () {
    this.view.clear();
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
  };

  ScanBarcodePresenter.prototype.displayErrorMessage = function (message) {
    this.view.displayErrorMessage(message);
  };

  ScanBarcodePresenter.prototype.isValid = function () {
    this.view.setModelBarcode(this.model);
    return this.model.isValid();
  };

  ScanBarcodePresenter.prototype.focus = function () {
    this.view.focus();

    return this;
  };

  ScanBarcodePresenter.prototype.enable = function () {
    this.view.enable();
  };

  ScanBarcodePresenter.prototype.disable = function () {
    this.view.disable();
  };


  return {
    register:function (callback) {
      callback('scan_barcode_presenter', function (owner, factory) {
        return new ScanBarcodePresenter(owner, factory);
      });
    }
  };
});
