define([
  'labware/views/tube_like',
  'text!images/spin_column.svg'
], function (TubeLike, spinColumnSvg) {
  'use strict';

  var svg = new DOMParser().parseFromString(spinColumnSvg, "image/svg+xml").documentElement;

  var unknownSpinColumn = {
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
      return (this.model && this.model.hasOwnProperty('spin_column')) ? this.model.spin_column : unknownSpinColumn;
    },

    imageFor: function() {
      return svg;
    }
  });

  return View;
});
