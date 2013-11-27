define([
  'text!app-components/labware/svg/tube.svg',
  'text!app-components/labware/svg/spin_column.svg',
  "text!app-components/labware/svg/filter_paper.svg",

  // Global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (tubeImage, spinColumnImage, filterPaperImage) {
  'use strict';

  var parser     = new DOMParser();
  var svgElement = function(svg) { return parser.parseFromString(svg, "image/svg+xml").documentElement; };

  // TUBE INFORMATION
  var tubeSvg = svgElement(tubeImage);
  var unknownTube = {
    barcode: undefined,
    volume: undefined,
    type: undefined
  };

  // SPIN COLUMN INFORMATION
  var spinColumnSvg = svgElement(spinColumnImage);
  var unknownSpinColumn = {
    barcode: undefined,
    volume: undefined,
    type: undefined
  };

  // FILTER PAPER INFORMATION
  var filterPaperSvg = svgElement(filterPaperImage);
  var unknownFilterPaper = {
    barcode: undefined
  };


  return {
    tube:        TubeLike(unknownTube,       _.constant(tubeSvg)),
    spin_column: TubeLike(unknownSpinColumn, _.constant(spinColumnSvg)),
    filter_paper: TubeLike(unknownFilterPaper, _.constant(filterPaperSvg))
  };

  function TubeLike(unknown, picker) {
    return function(view, labware) {
      labware = labware || unknown;

      view.empty().append(document.importNode(picker(labware), true));

      // Ensure the tube is filled, and that an unused marker is displayed if necessary.
      view.find("svg .aliquot").attr('class', cssForType(labware.type));
      view.find("svg .unused")[labware.tracked === false ? 'show' : 'hide']();

      // Display the extraneous data
      _.chain(labware)
       .omit(['resourceType', 'tracked'])
       .each(_.partial(displayValueIfSet, view))
       .value();

      view.show();
    }
  };

  function displayValueIfSet(view, value, field) {
    var element = view.find("svg ." + field);
    if (_.isUndefined(value)) {
      element.hide();
    } else {
      element.show().find(".value").text(value);
    }
  }

  function cssForType(type) {
    return _.isUndefined(type) ? "empty" : type.replace(/[^\w-]+/g, '_').toLowerCase();
  }
});
