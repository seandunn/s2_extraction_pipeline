//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([], function() {
  return {
    // Convenience function to deal with correcting "A01" to "A1"
    remapLocation: function(location) {
      var positionRow = location[0];
      var positionColumn = location.substring(1, location.length);
      return positionRow + parseInt(positionColumn);
    }
  };
});
