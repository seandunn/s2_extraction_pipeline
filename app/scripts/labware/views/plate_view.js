define(['text!images/96_plate.svg', 'text!images/384_plate.svg'], function (plate96Svg, plate384Svg) {
  'use strict';

  // Parse the SVG xml data for the spin column image
  var parser = new DOMParser();
  var plateSvg = {
    "96":  parser.parseFromString(plate96Svg, "image/svg+xml").documentElement,
    "384": parser.parseFromString(plate384Svg, "image/svg+xml").documentElement
  };

  var plateView = function (owner, jquerySelection) {
    this.owner = owner;
    this.container = jquerySelection;
    this.model = undefined;

    return this;
  };


  plateView.prototype.renderView = function () {

    this.release();
    var newPlate = undefined;
    var element  = plateSvg["96"];

    if (this.model && this.model.hasOwnProperty('plate')) {
      newPlate = this.model.plate;
      element  = plateSvg["" + (newPlate.number_of_rows * newPlate.number_of_columns)];
    }

    this.container().append(document.importNode(element, true));

    if (newPlate) {
      // If the plate wells have aliquots then display the plate as filled
      var container = this.container();
      _.each(newPlate.wells, function(value, location) {
        container.find("svg #" + location).attr("class", value);
      });

      this.container().find("svg #Barcode_Text").text('Barcode: ' + newPlate.barcode);
    }

    return this;
  };

  plateView.prototype.release = function () {
    this.container().empty();
  };

  return plateView;

});
