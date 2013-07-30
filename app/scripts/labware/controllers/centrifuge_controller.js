define(['labware/views/centrifuge_view',
    'labware/controllers/base_controller'],
    function (View, BaseController) {
    'use strict';

    var centrifugeController = function (owner, controllerFactory) {
        var labType = "centrifuge";
        BaseController.call(this);
        this.controllerFactory = controllerFactory;
        this.init(owner, View, labType);
        window.centrifugeController = this;

        return this;
    };

    centrifugeController.prototype = new BaseController();

    /* Sets up the controller
     *
     *
     * Arguments
     * ---------
     * jquerySelection: The jQuery selection for the view
     *
     *
     * Returns
     * -------
     * this
     */
    centrifugeController.prototype.setupController = function (jquerySelection) {
        this.setupPlaceholder(jquerySelection);
        this.setupView();
        this.renderView();

        return this;
    };


    /* Draws the centrifuge in the given container space
     *
     *
     * Arguments
     * ---------
     * data:    spin column data object
     *
     * 
     * Returns
     * -------
     * this
     */
    centrifugeController.prototype.renderView = function () {

        // Pass the update call down to the view
        this.currentView.renderView();

        return this;
    };

    /* Passes down to the view the call to initialise a select
     *  associated with the centrifuge
     *
     *
     * Arguments
     * ---------
     * listContainer:    The jQuery selection of the select object
     *
     * 
     * Returns
     * -------
     * this
     */
    centrifugeController.prototype.initTubesList = function (listContainer) {
        this.currentView.initTubesList(listContainer);

        return this;
    };

    /* Determines which tubes are displayed given the number to display
     *
     *
     * Arguments
     * ---------
     * tubesString:    The number of tubes to display in string format
     *
     * 
     * Returns
     * -------
     * this
     */
    centrifugeController.prototype.displayTubes = function (tubesString) {

        var numTubes = parseInt(tubesString, 10);

        switch (numTubes) {
            case 0:
                this.currentView.setTubes([]);
                break;
            case 2:
                this.currentView.setTubes([1, 2]);
                break;
            case 3:
                this.currentView.setTubes([1, 6, 9]);
                break;
            case 4:
                this.currentView.setTubes([1, 3, 2, 4]);
                break;
            case 5:
                this.currentView.setTubes([1, 3, 9, 4, 6]);
                break;
            case 6:
                this.currentView.setTubes([1, 3, 5, 2, 4, 6]);
                break;
            case 7:
                this.currentView.setTubes([1, 3, 5, 11, 2, 6, 8]);
                break;
            case 8:
                this.currentView.setTubes([1, 3, 5, 7, 2, 4, 6, 8]);
                break;
            case 9:
                this.currentView.setTubes([1, 3, 5, 9, 11, 2, 6, 8, 10]);
                break;
            case 10:
                this.currentView.setTubes([1, 3, 5, 7, 9, 2, 4, 6, 8, 10]);
                break;
            case 12:
                this.currentView.setTubes([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
                break;

        }

        return this;
    };

    return centrifugeController;
});
