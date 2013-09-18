define([
  'labware/views/plate_like',
  'text!images/rack.svg'
], function (PlateLike, rackSvg) {
  'use strict';

  var svg = new DOMParser().parseFromString(rackSvg, "image/svg+xml").documentElement;

  var unknownRack = {
    barcode: undefined,
    locations: []
  };

  return PlateLike.extend({
    labware: function() {
      return (this.model && this.model.hasOwnProperty('tube_rack')) ? this.model.tube_rack : unknownRack;;
    },

    imageElement: function() {
      return svg;
    }
  });
});
