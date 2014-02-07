define(['config'], function (config) {
  'use strict';

  var BarcodeChecker = Object.create(null);

  function checkPrefix(barcode, prefixes){
    if (!prefixes || ($.isArray(prefixes) && prefixes.length === 0) ) { return true; }
    return _.some(prefixes, function(prefix){
      return barcode.indexOf(prefix) === 0;
    })
  }

  $.extend(BarcodeChecker,
      {
        isBarcodeValid:           function (barcode, barcodePrefixes) {
          return (/^\d{12,13}$/.exec(barcode) !== null) && checkPrefix(barcode, barcodePrefixes);
        },
        is2DTubeBarcodeValid: function (barcode, barcodePrefixes) {
          return /^FR\d{8}$/.exec(barcode) !== null && checkPrefix(barcode, barcodePrefixes);
        },
        isKitBarcodeValid: function (barcode, barcodePrefixes) {
          return /^\d{22}$/.exec(barcode) !== null && checkPrefix(barcode, barcodePrefixes);
        }
      }
  );
  return BarcodeChecker;
});

