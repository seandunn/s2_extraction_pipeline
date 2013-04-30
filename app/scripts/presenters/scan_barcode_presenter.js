define([
       'extraction_pipeline/views/scan_barcode_view'
], function (View) {
  'use strict';

  var ScanBarcodePresenter = function (owner, presenterFactory) {
    this.owner = owner;
    this.presenterFactory = presenterFactory;
    return this;
  };

  ScanBarcodePresenter.prototype.setupPresenter = function (inputModel, jquerySelection) {
    this.jquerySelection = jquerySelection;

    // this.updateModel(inputModel); // we do it before the setup view, because we know everything... no need for a tmp view
    this.model = inputModel;
    this.view = new View(this);
    // this.view.render(this.model);
    return this;
  };

  ScanBarcodePresenter.prototype.renderView = function () {
    this.jquerySelection().append(this.view.render(this.model, this.jquerySelection()));
  };

  ScanBarcodePresenter.prototype.release = function () {
    this.view.clear();
  };

  ScanBarcodePresenter.prototype.childDone = function (presenter, action, model) {

    if (action == "barcodeScanned") {
      this.owner.childDone(this, "barcodeScanned", model);
    } else if (action === "parentError") {
      this.model.customError = (model && model.message) ? model.message : "Unknown error";
      this.model.busy = false;
      this.model.barcode = "";
    }
  };

  ScanBarcodePresenter.prototype.handleBarcode = function (model) {
    this.model = model
  };

  ScanBarcodePresenter.prototype.displayErrorMessage = function (message) {
    var selection = this.jquerySelector().find('.alert-error');
    var text = 'Error!';

    if (message) {
      text += message;
    }

    var tmp = $('<h4/>', {
      class:'alert-heading',
      text:text
    });

    tmp.appendTo(selection.empty());
    selection.css('display', 'block');
  };

  ScanBarcodePresenter.prototype.isValid = function () {
    this.view.setModelBarcode(this.model);
    return true; // replaces model method that always returns true.
  };

  ScanBarcodePresenter.prototype.focus = function () {
    this.jquerySelection().find('input').focus();
  };

  ScanBarcodePresenter.prototype.enable = function () {
    this.jquerySelection().find(".barcodeInput").removeAttr('disabled', 'disabled');
  };

  ScanBarcodePresenter.prototype.disable = function () {
    this.jquerySelection().find(".barcodeInput").attr('disabled', 'disabled');
  };


  return {
    register:function (callback) {
      callback('scan_barcode_presenter', function (owner, factory) {
        return new ScanBarcodePresenter(owner, factory);
      });
    }
  };
});
