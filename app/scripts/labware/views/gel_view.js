/* Helper function which determines whether an object is empty
 *
 *
 * Arguments
 * ---------
 * obj: The object to be examined
 *
 *
 * Returns
 * -------
 * whether the object is empty or not (bool)
 */
function is_empty(obj) {

  // Assume if it has a length property with a non-zero value
  // that that property is correct.
  if (obj.length && obj.length > 0)    return false;
  if (obj.length && obj.length === 0)  return true;

  for (var key in obj) {
    if (hasOwnProperty.call(obj, key))    return false;
  }

  return true;
}

define(['text!labware/../images/96_gel.svg'], function (gelSvg) {
  'use strict';

  var gelView = function (owner, jquerySelection) {
    this.owner = owner;
    this.container = jquerySelection;
    this.model = undefined;

    return this;
  };


  /* Draws the plate in the given container space
   *
   *
   * Arguments
   * ---------
   * data:    The gel plate data object
   *
   *
   * Returns
   * -------
   * The gel plate uuid
   */
  gelView.prototype.renderView = function () {

    this.release();

    // Parse the SVG xml data for the spin column image
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(gelSvg, "image/svg+xml");

    // Store the xml data in an object
    var importedNode = document.importNode(xmlDoc.documentElement, true);

    // Append the svn image data the chosen section placeholder
    this.container().append(importedNode);

    if (this.model && this.model.hasOwnProperty('gel')) {

      // Store the gel plate data from the json object in a hash with the uuid as a unique identifier
      var newGel = this.model.gel;
      var labels = newGel.labels;

      // If the plate windows have samples then display the window as filled
      for (var window in newGel.windows) {
        if (newGel.windows[window].length > 0) {
          this.fillWindow(window);
        }
      }

      this.container().find("svg #Barcode_Text").text('Barcode: ' + labels.barcode.value);
    }

    return this;
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
  gelView.prototype.release = function () {
    this.container().empty();
  };

  /* Modifies the plate window in the defined HTML section container to display as full
   *
   *
   * Arguments
   * ---------
   * container:    The selected jQuery element
   *
   *
   * Returns
   * -------
   * void
   */
  gelView.prototype.fillWindow = function (window) {

    // Selects the svg element and changes the display property to show a sample in the window
    this.container().find("svg #" + window).css("fill", "blue");
  };

  return gelView;

});