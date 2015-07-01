//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  'lib/underscore_extensions'
], function() {
  'use strict';

  return {
    from: function(dataAsText) {
      return looksLikeExcel(dataAsText) ? undefined : _.parseAsSeparatedRows(dataAsText, ",");
    }
  };

  // Determines if the file looks like it might have been an Excel file uploaded.  The real issue here
  // is that the UTF-8 decoding of the file in the upload might have failed, which causes the first
  // characters to be 65533 in the case of Excel.
  //
  // Really we should check the first bytes against this:
  //  [ 0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1 ]
  // This is the header for Excel files in LSB first.
  function looksLikeExcel(data) {
    return data.charCodeAt(0) === 65533;
  }
});
