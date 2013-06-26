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
      var util = this;
      var merged = {};
      for (var each in bar) {
        if (foo.hasOwnProperty(each) && bar.hasOwnProperty(each)) {
          if (typeof(foo[each]) === "object" && typeof(bar[each]) === "object") {
            merged[each] = util.deepMerge(foo[each], bar[each]);
          } else {
            // chooses bar's version if both objects possess the key
            merged[each] = bar[each];
          }
        } else if (bar.hasOwnProperty(each)) {
          merged[each] = bar[each];
        }
      }
      for (var each in foo) {
        if (!(each in bar) && foo.hasOwnProperty(each)) {
          merged[each] = foo[each];
        }
      }
      return merged;
    }
  });

  return Util;
});
