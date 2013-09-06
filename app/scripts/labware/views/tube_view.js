define([
  'labware/views/tube_like',
  'text!images/tube.svg',
  'text!images/waste_tube.svg'
], function (TubeLike, tubeSvg, wasteTubeSvg) {
  'use strict';

  var parser = new DOMParser();
  var svg = {
    tube: parser.parseFromString(tubeSvg, "image/svg+xml").documentElement,
    waste_tube: parser.parseFromString(wasteTubeSvg, "image/svg+xml").documentElement
  };

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
      return svg.tube;
    },

    drawWasteTube: function() {
      return this.drawLabware(unknownTube, svg.waste_tube);
    },
  });

  return View;
});
