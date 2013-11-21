define([], function () {

  var Util = Object.create(null);

  $.extend(Util, {
    pad: function (barcode, validLength, pad) {
      return _.string.lpad(barcode, validLength || 13, pad || "0");
    },

    // Merges two objects recursively
    deepMerge: function (foo, bar) {
      return _.deepMerge(foo, bar);
    }
  });

  return Util;
});
