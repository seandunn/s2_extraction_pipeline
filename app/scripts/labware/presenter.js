define([], function() {
  'use strict';

  var barcodeLookup = optional('labels', 'barcode', 'value');

  // Anything not listed in these mappings is assumed to apply the identity mapping.
  var resourceTypeToLabwareDataMappers = {
    // These all behave like they are plates, with locations mapping to aliquots
    plate:     plateLikePresenter(locationExtraction('wells'), 'number_of_columns', 'number_of_rows'),
    gel:       plateLikePresenter(locationExtraction('windows')),
    tube_rack: plateLikePresenter(extractTubesFromRack),

    // These all behave like they are tubes, with the labware containing the aliquots directly
    tube:        tubeLikePresenter(),
    spin_column: tubeLikePresenter()
  };

  // This is a mixin for classes that wish to do labware presentation.
  return {
    presentResource: function(resource) {
      if (_.isUndefined(resource)) return;

      var presenter = resourceTypeToLabwareDataMappers[resource.resourceType] || _.identity;
      return presenter(resource);
    }
  };

  function plateLikePresenter(locationExtractor) {
    return presenter(_.drop(arguments, 1), detailsFrom);

    function detailsFrom(labware) {
      return {
        barcode: barcodeLookup(labware),
        locations: _.chain(locationExtractor(labware)).map(locationCss).object().value()
      };
    }
  }

  function tubeLikePresenter() {
    return presenter(_.drop(arguments, 0), trackedDetailsFrom);

    function trackedDetailsFrom(labware) {
      return {
        barcode: barcodeLookup(labware),
        type: aliquotTypeFor(labware.aliquots),
        volume: volumeIn(labware)
      };
    }
  }

  function presenter(fields, detailsHelper) {
    fields.unshift('resourceType');
    fields.unshift('tracked');

    return function(labware) {
      var details = (labware.tracked === false) ? {} : detailsHelper(labware);
      return _.extend(_.pick(labware, fields), details);
    };
  }

  function optional() {
    var path = arguments;
    return function(value) {
      return _.reduce(path, function(memo, step) { return memo && memo[step]; }, value);
    };
  }

  function locationExtraction(name) {
    return function(labware) {
      return _.pairs(labware[name]);
    };
  }

  function extractTubesFromRack(rack) {
    return _.map(rack.tubes, function(tube, location) {
      return [location, tube.aliquots];
    });
  }

  function locationCss(pair) {
    return [pair[0], aliquotTypeFor(pair[1])];
  }
  function empty(aliquots) {
    return _.isUndefined(aliquots) || (aliquots.length == 0);
  }

  function aliquotTypeFor(aliquots) {
    return empty(aliquots) ? "empty" : aliquots[0].type;
  }
  function volumeIn(tube) {
    if (empty(tube.aliquots)) {
      return "Empty";
    } else if (!_.isUndefined(tube.aliquots[0].quantity)) {
      return tube.aliquots[0].quantity + " " + tube.aliquots[0].unit;
    } else {
      return "Unmeasured";
    }
  }
});
