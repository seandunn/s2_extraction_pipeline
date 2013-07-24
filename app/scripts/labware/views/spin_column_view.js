define(['text!labware/../images/spin_column2.svg'], function (spinColumnSvg) {
    'use strict';

    var spinColumnView = function (owner, jquerySelection) {
        this.owner = owner;
        this.container = jquerySelection;
        this.model = undefined;

        return this;
    };


    /* Draws the spin column in the given container space
     *
     *
     * Arguments
     * ---------
     * data:    The spin column data object
     *
     *
     * Returns
     * -------
     * The spin column uuid
     */
    spinColumnView.prototype.renderView = function () {

      var barcodeText = 'N/A';

      this.release();
      // Append the svn image data the chosen section placeholder
      this.container().append(spinColumnSvg);

      if (this.model && this.model.hasOwnProperty('spin_column')) {
        // Store the tube data from the json object
        var newSc = this.model.spin_column;

        // Labels include the tube barcode and its uuid
        var labels = newSc.labels;
        barcodeText = labels.barcode.value;
        this.container().find("svg #Barcode_Text").text('Barcode: ' + barcodeText);
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
    spinColumnView.prototype.release = function () {
        this.container().empty();
    };

    return spinColumnView;

});