define([], function () {
  'use strict';

  var ScanBarcodeModel = function (data) {
    /* Constructor
     *
     * Arguments
     * ---------
     * data = {value:"1234567890"}
     */
    this.barcode = data.value;
  };

  ScanBarcodeModel.prototype.isValid = function () {
    return true;
  };

  return ScanBarcodeModel;
});
