define(['labware/views/qia_cube_view',
    'labware/controllers/base_controller'],
    function (View, BaseController) {
    'use strict';

    var qiaCubeController = function (owner, controllerFactory) {
        var labType = "qiaQube";
        BaseController.call(this);
        this.controllerFactory = controllerFactory;
        this.init(owner, View, labType);
        window.qiaController = this;

        return this;
    };

    qiaCubeController.prototype = new BaseController();

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
    qiaCubeController.prototype.setupController = function (jquerySelection) {
        this.setupPlaceholder(jquerySelection);
        this.setupView();
        this.renderView();

        return this;
    };

    /* Draws the spin column in the given container space
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
    qiaCubeController.prototype.renderView = function () {
        // Pass the update call down to the view
        this.currentView.renderView();

        return this;
    };

    /* Passes down to the view the call to initialise a select
     *  associated with the QiaCube
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
    qiaCubeController.prototype.initTubesList = function (listContainer) {
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
    qiaCubeController.prototype.displayTubes = function (tubesString) {

        var numTubes = parseInt(tubesString, 10);
        var tubesConfiguration = this.getTubeConfigurations(numTubes);

        this.currentView.setTubes(tubesConfiguration);

        return this;
    };

    /* Gets the tube configuration for the number of tubes to be displayed
     *
     *
     * Arguments
     * ---------
     * numTubes:    The number of tubes to display
     *
     *
     * Returns
     * -------
     * The tube configuration
     */
    qiaCubeController.prototype.getTubeConfigurations = function (numTubes) {
        var tubesConfiguration = [];

        switch (numTubes) {
            case 0:
                tubesConfiguration = [];
                break;
            case 2:
                tubesConfiguration = [1, 7];
                break;
            case 3:
                tubesConfiguration = [1, 9, 5];
                break;
            case 4:
                tubesConfiguration = [1, 2, 7, 8];
                break;
            case 5:
                tubesConfiguration = [1, 2, 5, 8, 9];
                break;
            case 6:
                tubesConfiguration = [1, 2, 3, 7, 8, 9];
                break;
            case 7:
                tubesConfiguration = [1, 2, 3, 6, 7, 9, 10];
                break;
            case 8:
                tubesConfiguration = [1, 2, 3, 4, 7, 8, 9, 10];
                break;
            case 9:
                tubesConfiguration = [1, 2, 3, 5, 6, 7, 9, 10, 11];
                break;
            case 10:
                tubesConfiguration = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11];
                break;
            case 12:
                tubesConfiguration = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                break;

        }

        return tubesConfiguration;
    };

    return qiaCubeController;
});
