define([], function () {

  var Util = Object.create(null);

  $.extend(Util, {
    pad: function (barcode, validLength, pad) {
      // we don't want padding on non-numeric tube barcodes
      if (isNaN(parseInt(barcode))) {
        return barcode;
      }
      pad = pad || '0';
      validLength = validLength || 13;
      return barcode.length >= validLength ? barcode : new Array(validLength - barcode.length + 1).join(pad) + barcode;
    },

    // Merges two objects recursively
    deepMerge: function (foo, bar) {
      return _.deepMerge(foo, bar);
    }
  });

  return Util;
});
