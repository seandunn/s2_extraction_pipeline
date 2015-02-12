//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
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

