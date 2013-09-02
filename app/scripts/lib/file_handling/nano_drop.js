define([
  'lib/underscore_extensions'
], function() {
  'use strict';

  var mappingFieldValues = {
    "Plate ID":  _.identity,
    "Well":      _.identity,
    "Sample ID": _.identity,
    "Conc.":     parseFloat,
    "260/280":   parseFloat,
    "260/230":   parseFloat
  };

  return {
    from: function(data) {
      return _.chain(data)
              .parseAsSeparatedRows("\t")
              .drop(4)
              .untabularize()
              .map(_.picker(_.keys(mappingFieldValues)))
              .map(_.partial(_.mapFields, mappingFieldValues))
              .groupMap(_.field("Plate ID"), plateToWells)
              .value();
    },

    to: function(plate) {
      return _.chain(plate.wells)
              .map(wellAndLocationToDetails)
              .tabularize(["Well", "Sanger ID"])
              .toCSV("\t")
              .value();
    }
  };

  function wellAndLocationToDetails(well, location) {
    return {
      "Well": location,
      "Sanger ID": well[0].sample.uuid
    };
  }

  function plateToWells(wells, plate) {
    return [
      plate,
      _.groupMap(wells, _.field("Well"), wellToDetails)
    ];
  }
  function wellToDetails(details, location) {
    return [
      location,
      _.omit(details[0],["Plate ID", "Well"])
    ];
  }
});
