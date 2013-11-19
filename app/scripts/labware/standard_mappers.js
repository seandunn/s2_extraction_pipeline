define([
  "lib/underscore_extensions"
], function() {
  "use strict";

  var barcodeLookup = field("barcode", optional("labels", "barcode", "value"));
  var lotNoLookup   = field("lot-no",  optional("labels", "lot-no",  "value"));

  // Anything not listed in these mappings is assumed to apply the identity mapping.
  var resourceTypeToLabwareDataMappers = {
    // These all behave like they are plates, with locations mapping to aliquots
    plate:        plateLikePresenter(locationExtraction("wells"), "number_of_columns", "number_of_rows"),
    gel:          plateLikePresenter(locationExtraction("windows")),
    tube_rack:    plateLikePresenter(extractTubesFromRack),

    // These all behave like they are tubes, with the labware containing the aliquots directly
    tube:        tubeLikePresenter(),
    filter_paper: plateLikePresenter(lotNoLookup),
    spin_column: tubeLikePresenter()
  };

  // This is a mixin for classes that wish to do labware presentation.
  return function(resource) {
    var presenter = resourceTypeToLabwareDataMappers[resource.resourceType] || _.identity;
    return presenter(resource);
  };

  function field(name, extractor) {
    return function(labware) {
      var value = extractor(labware);
      return (_.isUndefined(value) || _.isNull(value)) ? {} : _.build(name, value);
    };
  }

  function plateLikePresenter(locationExtractor) {
    return presenter(_.drop(arguments, 1), detailsFrom);

    function detailsFrom(labware) {
      return {
        locations: _.chain(locationExtractor(labware)).map(locationCss).object().value()
      };
    }
  }

  function tubeLikePresenter() {
    return presenter(_.drop(arguments, 0), trackedDetailsFrom);

    function trackedDetailsFrom(labware) {
      return {
        type: aliquotTypeFor(labware.aliquots),
        volume: volumeIn(labware)
      };
    }
  }

  function presenter(fields, detailsHelper) {
    fields.unshift("resourceType");
    fields.unshift("tracked");
    fields.unshift(barcodeLookup);

    // Fields that are not already functions are turned into the appropriate picker so that we can
    // then use a collapser to build oour final object.
    var pickers   = _.map(fields, function(field) { return _.isFunction(field) ? field : _.picker(field) });
    var collapser = _.collapser(pickers);

    return function(labware) {
      return collapser(
        (labware.tracked === false) ? {} : detailsHelper(labware),
        labware
      );
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
