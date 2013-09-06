define([], function() {
  'use strict';

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
    var fieldsToOmit = _.drop(arguments, 1);
    fieldsToOmit.unshift('resourceType');

    return function(labware) {
      return _.extend(_.pick(labware, fieldsToOmit), {
        barcode: optional('labels', 'barcode', 'value')(labware),
        locations: _.chain(locationExtractor(labware)).map(locationCss).object().value()
      });
    };
  }

  function optional() {
    var path = arguments;
    return function(value) {
      return _.reduce(path, function(memo, step) { return memo && memo[step]; }, value);
    };
  }

  function tubeLikePresenter() {
    var fieldsToOmit = _.drop(arguments, 0);
    fieldsToOmit.unshift('resourceType');

    return function(labware) {
      return _.extend(_.pick(labware, fieldsToOmit), {
        barcode: labware.labels.barcode.value,
        type: aliquotTypeFor(labware.aliquots),
        volume: volumeIn(labware)
      });
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
    return aliquots.length == 0;
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
