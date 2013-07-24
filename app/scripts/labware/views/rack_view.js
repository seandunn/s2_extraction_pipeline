define(['text!labware/../images/rack.svg'], function (rackSvg) {
  'use strict';

  var rackView = function (owner, jquerySelection) {
    this.owner = owner;
    this.container = jquerySelection;
    this.model = undefined;

    return this;
  };


  rackView.prototype.renderView = function () {

    this.release();
    this.drawRack(rackSvg);

    if (this.model && this.model.hasOwnProperty('tube_rack')) {

      // Store the spin column data from the json object in a hash with the uuid as a unique identifier
      var newRack = this.model.tube_rack;
      var ean13 = newRack.labels && newRack.labels.barcode.value;
      for (var well in newRack.tubes) {
        this.fillWell(well);
      }

      this.container().find("svg #Barcode_Text").text('Barcode: ' + ean13 || '');
    }

    return this;
  };

  rackView.prototype.drawRack = function(inputSvg) {
    this.release();
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(inputSvg, "image/svg+xml");

    // Store the xml data in an object
    var importedNode = document.importNode(xmlDoc.documentElement, true);

    // Append the svn image data the chosen section placeholder
    this.container().append(importedNode);
  };

  rackView.prototype.release = function () {
    this.container().empty();
  };

  rackView.prototype.fillWell = function (well, colour) {

    // Selects the svg element and changes the display property to show a liquid in the well
    this.container().find("svg #" + well).css("fill", colour || "lime");
  };

  rackView.prototype.resetWells = function () {
    this.container().find("svg ellipse").css("fill", "black");
    return this;
  };

  return rackView;

});
