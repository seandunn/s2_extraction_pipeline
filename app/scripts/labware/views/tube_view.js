define(['text!labware/../images/tube_final5.svg', 'text!labware/../images/waste_tube.svg'], function (tubeSvg, wasteTubeSvg) {
  'use strict';

  var tubeView = function (owner, jquerySelection) {
    this.owner = owner;
    this.container = jquerySelection;

    return this;
  };


  tubeView.prototype.renderView = function () {
    var volumeText  = "Empty";
    var barcodeText = "N/A";

  this.drawTube(tubeSvg);

  if (this.model && this.model.hasOwnProperty('tube')) {

    // Store the tube data from the json object
    var newTube = this.model.tube;

    // Labels include the tube barcode and its uuid
    var labels = newTube.labels;
    barcodeText = labels.barcode.value;

    // If the tube has aliquots then display the tube as filled
    if (newTube.aliquots.length > 0) {

      // TODO: When we receive json with multiple aliquots this will have to be adapted to handle better
      var aliquot = newTube.aliquots[0];
      volumeText  = aliquot.quantity? (aliquot.quantity + " " + aliquot.unit) : "Currently Unmeasured";

      this.container().find("svg #Type_Text").text('Type: ' + aliquot.type);
      this.fillTube(aliquot.type);
    }

    // Set the detail text of the tube in question
    this.container().find("svg #Volume_Text").text('Quantity: ' + volumeText);
    this.container().find("svg #Barcode_Text").text('Barcode: ' + barcodeText);
  }

  return this;
};

tubeView.prototype.drawTube = function(inputSvg) {
  this.release();
  var tmp             = this.container().selector;
  this.selectorString = tmp.replace(/[\s\(\)]/gi, '_') + '_#linearGradientAliquot';
  var inputSvgStr     = inputSvg.replace(/linearGradientAliquot/gi, this.selectorString);
  this.container().append(inputSvgStr);
};

tubeView.prototype.drawWasteTube = function() {
  this.drawTube(wasteTubeSvg);
  return this;
}

tubeView.prototype.release = function () {
  this.container().empty();
};

tubeView.prototype.fillTube = function (aliquotType) {
  // Selects the svg element and changes the display property to show a liquid in the tube 
  this.container().find("svg #aliquot").css("display", "block");
  // Change the liquid colour to match the variation in type
  this.container().find("svg .aliquotGradientSelector").attr("xlink:href", "#Tube_Gradient_" + aliquotType);
};

return tubeView;

});
