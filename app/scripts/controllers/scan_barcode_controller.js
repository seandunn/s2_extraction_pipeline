define([
       'text!html_partials/_scan_barcode.html'
], function (scanBarcodePartialHtml) {
  'use strict';

  var ScanBarcodeController = function (owner, controllerFactory) {
    this.owner = owner;
    this.controllerFactory = controllerFactory;
    return this;
  };

  ScanBarcodeController.prototype.init = function (inputModel) {
    this.model = inputModel;
    return this;
  };

  ScanBarcodeController.prototype.renderView = function () {
    return $(_.template(scanBarcodePartialHtml)(this.model));
  };

  return {
    register:function (callback) {
      callback('scan_barcode_controller', function (owner, factory) {
        return new ScanBarcodeController(owner, factory);
      });
    }
  };
});

