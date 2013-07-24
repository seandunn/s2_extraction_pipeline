define(['text!labware/../images/waste_tube.svg'], function (wasteTubeSvg) {
  'use strict';

  var tubeView = function (owner, jquerySelection) {
    this.owner = owner;
    this.container = jquerySelection;
    this.model = undefined;

    return this;
  };


  /* Draws the test tube in the given container space
   *
   *
   * Arguments
   * ---------
   * data:    The tube data object
   *
   *
   * Returns
   * -------
   * The tube uuid
   */
  tubeView.prototype.renderView = function () {

    this.drawTube(wasteTubeSvg);
    return this;

    return this;
  };

  tubeView.prototype.drawTube = function (inputSvg) {

    this.release();

    // Parse the SVG xml data for the plate image
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(inputSvg, "image/svg+xml");

    // Store the xml data in an object
    var importedNode = document.importNode(xmlDoc.documentElement, true);

    // Append the svn image data the chosen section placeholder
    this.container().append(importedNode);
  };

  /* Removes the image from the assigned view container
   *
   *
   * Arguments
   * ---------
   *
   *
   * Returns
   * -------
   * this
   */
  tubeView.prototype.release = function () {
    this.container().empty();
  };

  return tubeView;

});