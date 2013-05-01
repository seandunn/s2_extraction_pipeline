define([
       'text!extraction_pipeline/html_partials/scan_barcode_partial.html'
], function (scanBarcodePartialHtml) {
  'use strict';

  var ScanBarcodePresenter = function (owner, presenterFactory) {
    this.owner = owner;
    this.presenterFactory = presenterFactory;
    return this;
  };

  ScanBarcodePresenter.prototype.setupPresenter = function (inputModel) {
    this.model = inputModel;
    return this;
  };

  ScanBarcodePresenter.prototype.renderView = function () {
    return $(_.template(scanBarcodePartialHtml)(this.model));
  };

  return {
    register:function (callback) {
      callback('scan_barcode_presenter', function (owner, factory) {
        return new ScanBarcodePresenter(owner, factory);
      });
    }
  };
});
