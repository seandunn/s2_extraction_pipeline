define([], function() {
  'use strict';

  var ScanBarcodeModel = function(type) {
    this.type = type;
    this.barcode = "";
    }

  ScanBarcodeModel.prototype.isValid = function() {
    if(this.barcode.length === 0) {
      return true;
    }
    if(this.type === "tube") {
      return this.isValidTubeBarcode();
    }
    return false;
  }

  ScanBarcodeModel.prototype.isValidTubeBarcode = function() {
    // TODO : this is a placeholder
    // Tube pattern expected to be tubeXXXX where XXXX is an integer
    var patt = /tube[0-9]{4}/g;
    return patt.test(this.barcode);
  }

  return ScanBarcodeModel;
});
