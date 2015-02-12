//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  'lib/location_helper',
  'lib/underscore_extensions'
], function(LocationHelper) {
  'use strict';

  return {
    from: function(data) {
      // NOTE: has no header row: LOCATION,BARCODE
      return _.chain(data)
              .parseAsSeparatedRows(",")
              .map(_.partial(_.mapIndexes, [[0,LocationHelper.remapLocation]]))
              .filter(function(row) { return row[1].toUpperCase() !== "NO READ"; })
              .map(function(row) { return [row[1],row[0]]; })
              .object()
              .value();
    }
  };
});
