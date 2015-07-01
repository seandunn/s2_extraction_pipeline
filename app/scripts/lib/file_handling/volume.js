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
      return _.chain(data)
              .parseAsSeparatedRows(",")
              .untabularize()
              .map(_.partial(_.mapFields, {TUBE: LocationHelper.remapLocation, VOLAVG: parseFloat}))
              .reduce(buildReturnResult, {rack_barcode: undefined, tubes: []})
              .value();

      function buildReturnResult(memo, tubeData) {
        memo.rack_barcode = memo.rack_barcode || tubeData.RACKID;
        memo.tubes.push([tubeData.TUBE, tubeData.VOLAVG]);
        return memo;
      }
    }
  };
});
