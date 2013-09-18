define([
  'labware/views/plate_like',
  'text!images/96_gel.svg'
], function (PlateLike, gelSvg) {
  'use strict';

  var svg = new DOMParser().parseFromString(gelSvg, "image/svg+xml").documentElement;

  var unknownGel = {
    barcode: undefined,
    locations: []
  };

  return PlateLike.extend({
    labware: function() {
      return (this.model && this.model.hasOwnProperty('gel')) ? this.model.gel : unknownGel;
    },

    imageElement: function() {
      return svg;
    }
  });
});
