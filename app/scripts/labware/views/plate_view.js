define([
  'labware/views/plate_like',
  'text!images/96_plate.svg',
  'text!images/384_plate.svg'
], function (PlateLike, plate96Svg, plate384Svg) {
  'use strict';

  // Parse the SVG xml data for the spin column image
  var parser = new DOMParser();
  var plateSvg = {
    "96":  parser.parseFromString(plate96Svg, "image/svg+xml").documentElement,
    "384": parser.parseFromString(plate384Svg, "image/svg+xml").documentElement
  };

  var unknownPlate = {
    number_of_rows:8,
    number_of_columns:12,
    barcode: undefined,
    locations: []
  };

  return PlateLike.extend({
    labware: function() {
      return (this.model && this.model.hasOwnProperty('plate')) ? this.model.plate : unknownPlate;
    },

    imageElement: function(labware) {
      return plateSvg["" + (labware.number_of_rows * labware.number_of_columns)];
    }
  });
});
