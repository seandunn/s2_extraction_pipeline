define(['text!labware/../images/qia_cube.svg'], function (qiaCubeSvg) {
    'use strict';

    var qiaCubeView = function (owner, jquerySelection) {
        this.owner = owner;
        this.container = jquerySelection;
        this.tubesList = {};

        return this;
    };


    /* Draws the QiaCube in the given container space
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
    qiaCubeView.prototype.renderView = function () {

        this.release();

        // Parse the SVG xml data for the spin column image
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(qiaCubeSvg, "image/svg+xml");

        // Store the xml data in an object
        var importedNode = document.importNode(xmlDoc.documentElement, true);

        // Append the svn image data the chosen section placeholder     
        this.container().append(importedNode);

        // Initialise the QiaCube as Empty
        this.setTubes([]);

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
    qiaCubeView.prototype.release = function () {
        this.container().empty();
        return this;
    };

    /* Sets which tubes are displayed on the QiaCube
     *
     *
     * Arguments
     * ---------
     * tubes:    The array of tube elements to display
     * 
     * 
     * Returns
     * -------
     * void
     */
    qiaCubeView.prototype.setTubes = function (tubes) {

        for (var x = 1; x <= 12; x++) {
            var displaySwitch = "none";

            if (tubes.indexOf(x) > -1) {
                displaySwitch = "block";
            }

            // Selects the svg element and changes the display property of the current tube
            this.container().find("svg .tube" + x).css("display", displaySwitch);
        }

    };

    /* Initialises any select box associated with the QiaCube
     *
     *
     * Arguments
     * ---------
     * listContainer:    The selected jQuery element
     * 
     * 
     * Returns
     * -------
     * this
     */
    qiaCubeView.prototype.initTubesList = function (listContainer) {
        this.tubesList = listContainer;

        // Options aren't entirely consecutive so need to define individually
        var newOptions = {
            '0': '0',
            '2': '2',
            '3': '3',
            '4': '4',
            '5': '5',
            '6': '6',
            '7': '7',
            '8': '8',
            '9': '9',
            '10': '10',
            '12': '12'
        };

        // First selection
        var selectedOption = '0';

        // Compatibility with multiple browsers
        if (listContainer.prop) {
            var options = listContainer.prop('options');
        } else {
            var options = listContainer.attr('options');
        }

        // Clear options
        $('option', listContainer).remove();

        // Apply new options
        $.each(newOptions, function (val, text) {
            options[options.length] = new Option(text, val);
        });

        listContainer.val(selectedOption);

        // Hook the select object to the controller object
        // NOTE: Controller defines the qiaController object in the window on construction
        listContainer.change(function () {
            window.qiaController.displayTubes($(this).val());
        });

        return this;
    };

    return qiaCubeView;

});
