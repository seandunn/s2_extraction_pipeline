define([], function () {

  var Util = Object.create(null);

  $.extend(Util, {
    pad: function (barcode, validLength, pad) {
      // performs this check in case a 2D tube is scanned: we don't want padding on 2D tube barcodes
      if (isNaN(parseInt(barcode))) {
        return barcode;
      }
      pad = pad || '0';
      validLength = validLength || 13;
      return barcode.length >= validLength ? barcode : new Array(validLength - barcode.length + 1).join(pad) + barcode;
    }
  });

  return Util;
});
