define([
  'labware/views/tube_like',
  'text!images/tube.svg'
], function (TubeLike, tubeSvg) {
  'use strict';

  var parser = new DOMParser();
  var svg = parser.parseFromString(tubeSvg, "image/svg+xml").documentElement;

  var unknownTube = {
    barcode: undefined,
    volume: undefined,
    type: undefined
  };

  var View = function (owner, jquerySelection) {
    this.owner     = owner;
    this.container = jquerySelection;
    this.model     = undefined;

    return this;
  };

  _.extend(View.prototype, TubeLike, {
    labware: function() {
      return (this.model && this.model.hasOwnProperty('tube')) ? this.model.tube : unknownTube;
    },

    imageFor: function(labware) {
      return svg;
    }
  });

  return View;
});
