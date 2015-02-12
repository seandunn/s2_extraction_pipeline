//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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
              .reject(_.isUndefined)
              .tabularize(["Well", "Sanger ID"])
              .toCSV("\t")
              .value();
    }
  };

  function wellAndLocationToDetails(well, location) {
    if (well.length == 0) return undefined;
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
