define(['config'], function (config) {
  'use strict';

  var BarcodeChecker = Object.create(null);

  function checkPrefix(barcode, prefixes){
    if (!prefixes) return true;
    return _.some(prefixes, function(prefix){
      return barcode.indexOf(prefix) === 0;
    })
  }

  $.extend(BarcodeChecker,
      {
        isBarcodeValid:           function (barcode, barcodePrefixes) {
          return /^\d{13}$/.exec(barcode) !== null && checkPrefix(barcode, barcodePrefixes);
        },
        is2DTubeBarcodeValid: function (barcode, barcodePrefixes) {
          return /FR\d/.exec(barcode) !== null && checkPrefix(barcode, barcodePrefixes);
        },
        isKitBarcodeValid: function (barcode, barcodePrefixes) {
          return /^\d{13}$/.exec(barcode) !== null && checkPrefix(barcode, barcodePrefixes);
        }
      }
  );
  return BarcodeChecker;
});

