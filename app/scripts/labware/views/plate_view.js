define(['text!labware/../images/96_plate.svg', 'text!labware/../images/384_plate.svg'], function (plate96Svg, plate384Svg) {
    'use strict';

    var plateView = function (owner, jquerySelection) {
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
     * data:    The spin column data object
     *
     *
     * Returns
     * -------
     * The spin column uuid
     */
    plateView.prototype.renderView = function () {

        this.release();
        var plateSvg = plate96Svg;

        if (this.model && this.model.hasOwnProperty('plate')) {

            // Store the spin column data from the json object in a hash with the uuid as a unique identifier
            var newPlate = this.model.plate;

            if (this.countWells(newPlate.wells) === 384) {
                plateSvg = plate384Svg;
            }
        }

            // Parse the SVG xml data for the spin column image
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(plateSvg, "image/svg+xml");

            // Store the xml data in an object
            var importedNode = document.importNode(xmlDoc.documentElement, true);

            // Append the svn image data the chosen section placeholder
            this.container().append(importedNode);

        if (newPlate) {
            // If the plate wells have aliquots then display the plate as filled
            for (var well in newPlate.wells) {
                if (newPlate.wells[well].length > 0) {
                    this.fillWell(well);
                }
            }

          var labels = newPlate.labels;
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
    plateView.prototype.release = function () {
        this.container().empty();
    };

    /* Counts the number of wells on the plate to determine its type
     *
     *
     * Arguments
     * ---------
     * 
     * wells:    The collection of wells to be counted
     * 
     * 
     * Returns
     * -------
     * the number of wells
     */
    plateView.prototype.countWells = function (wells) {
        var count = 0;

        for (var well in wells) {
            count++;
        }

        return count;
    };

    plateView.prototype.fillWell = function (well) {
    
        // Selects the svg element and changes the display property to show a liquid in the well 
        this.container().find("svg #" + well).css("fill", "lime");
    };

    return plateView;

});
