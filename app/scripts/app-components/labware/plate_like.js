define([
  "text!app-components/labware/svg/96_plate.svg",
  "text!app-components/labware/svg/384_plate.svg",
  "text!app-components/labware/svg/rack.svg",
  "text!app-components/labware/svg/96_gel.svg",

  // Global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (plate96Image, plate384Image, rackImage, gelImage) {
  "use strict";

  var parser     = new DOMParser();
  var svgElement = function(svg) { return parser.parseFromString(svg, "image/svg+xml").documentElement; };

  // PLATE INFORMATION
  var plateSvg = {
    "96":  svgElement(plate96Image),
    "384": svgElement(plate384Image)
  };
  var unknownPlate = {
    number_of_rows:8,
    number_of_columns:12,
    barcode: undefined,
    locations: []
  };

  // RACK INFORMATION
  var rackSvg = svgElement(rackImage);
  var unknownRack = {
    barcode: undefined,
    locations: []
  };

  // GEL INFORMATION
  var gelSvg = svgElement(gelImage);
  var unknownGel = {
    barcode: undefined,
    locations: []
  };

  return {
    plate:        PlateLike(unknownPlate,       plateSvgPicker),
    tube_rack:    PlateLike(unknownRack,        _.constant(rackSvg)),
    gel:          PlateLike(unknownGel,         _.constant(gelSvg))
  };

  function plateSvgPicker(labware) {
    return plateSvg["" + (labware.number_of_rows * labware.number_of_columns)];
  }

  function PlateLike(unknown, picker) {
    return function(view, labware) {
      labware = labware || unknown;

      view.empty().append(document.importNode(picker(labware), true));

      // Display the information related to the individual locations
      _.each(labware.locations, function(value, location) {
        view.find("svg ." + location).attr("class", cssForType(value));
      });

      // Display any extraneous data
      _.chain(labware)
       .omit(["resourceType", "locations"])
       .each(_.partial(displayValueIfSet, view))
       .value();

      view.show();
    };
  }

  function displayValueIfSet(view, value, field) {
    var element = view.find("svg ." + field);
    if (_.isUndefined(value)) {
      element.hide();
    } else {
      element.show().find(".value").text(value);
    }
  }

  function cssForType(type) {
    return (_.isString(type))? type.replace(/[^\w-]+/g, "_").toLowerCase() : "empty";
  }
});
