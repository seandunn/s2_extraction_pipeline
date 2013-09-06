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
              .reduce(buildReturnResult, {rack_barcode: undefined, array: []})
              .value();

      function buildReturnResult(memo, tubeData) {
        memo.rack_barcode = memo.rack_barcode || tubeData.RACKID;
        memo.array.push([tubeData.TUBE, tubeData.VOLAVG]);
        return memo;
      }
    }
  };
});
