define([], function() {
  'use strict';

  // Anything not listed in these mappings is assumed to apply the identity mapping.
  var resourceTypeToLabwareDataMappers = {
    plate: function(plate) {
      return _.extend(_.pick(plate, 'resourceType', 'number_of_columns', 'number_of_rows'), {
        barcode: plate.labels.barcode.value,
        locations: _.chain(plate.wells).pairs().map(locationCss).object().value()
      });
    },

    gel: function(gel) {
      return _.extend(_.pick(gel, 'resourceType'), {
        barcode: gel.labels.barcode.value,
        locations: _.chain(gel.windows).pairs().map(locationCss).object().value()
      });
    },

    tube_rack: function(rack) {
      return _.extend(_.pick(rack, 'resourceType'), {
        barcode: rack.labels.barcode.value,
        locations: _.chain(rack.tubes).map(tubesToAliquots).map(locationCss).object().value()
      });

      function tubesToAliquots(tube, location) {
        return [location, tube.aliquots];
      }
    }
  };

  return function(labware) {
    var converter = resourceTypeToLabwareDataMappers[labware.resourceType] || _.identity;
    return converter(labware);
  };

  function locationCss(pair) {
    return [pair[0], cssForAliquots(pair[1])];
  }
  function cssForAliquots(aliquots) {
    return empty(aliquots) ? 'empty' : 'full';
  }
  function empty(aliquots) {
    return aliquots.length == 0;
  }
});
