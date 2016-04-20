//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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
