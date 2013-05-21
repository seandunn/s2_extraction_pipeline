define(['config'], function (config) {
  'use strict';

  var BarcodeChecker = Object.create(null);

  $.extend(BarcodeChecker,
      {
        isBarcodeValid:           function (barcode) {
          return /^\d{13}$/.exec(barcode) !== null;
        },
        is2DTubeBarcodeValid: function (barcode) {
          return /FR\d/.exec(barcode) !== null;
        },
        isKitBarcodeValid: function (barcode) {
          return /^\d{13}$/.exec(barcode) !== null;
        }
      }
  );
  return BarcodeChecker;
});

