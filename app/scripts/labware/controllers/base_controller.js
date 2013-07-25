define([], function () {
  'use strict';

  var baseController = function () {
    this.currentView = undefined;
    this.model = undefined;
    this.owner = undefined;
  };

  baseController.prototype.init = function (owner, view, labwareType) {
    this.View = view;
    this.labwareType = labwareType;
    this.owner = owner;
  };

  /* Initialises the controller and defines the view to be used
   *
   *
   * Arguments
   * ---------
   * container:    The selected jquery element
   *
   *
   * Returns
   * -------
   * this
   */
  baseController.prototype.setupView = function () {
    this.currentView = new this.View(this, this.jquerySelection);
    this.currentView.model = this.model;

    return this;
  };

  /* Sets up the controller
   *
   *
   * Arguments
   * ---------
   * inputModel:      The model for the controller
   *
   * jquerySelection: The jQuery selection for the view
   *
   *
   * Returns
   * -------
   * this
   */
  baseController.prototype.setupController = function (inputModel, jquerySelection) {
    this.setupPlaceholder(jquerySelection);
    this.updateModel(inputModel);

    return this;
  };

  /* Updates the model to be used with the controller
   *
   *
   * Arguments
   * ---------
   * inputModel:    The model for the controller
   *
   *
   * Returns
   * -------
   * this
   */
  baseController.prototype.updateModel = function (inputModel) {
    this.model = inputModel;
    this.setupView();
    this.owner.childDone(this, this.labwareType + ' rendered', inputModel);

    return this;
  };

  /* Sets up the placeholder to be used with the controller
   *
   *
   * Arguments
   * ---------
   * jquerySelection:    The selection for the controller
   *
   *
   * Returns
   * -------
   * this
   */
  baseController.prototype.setupPlaceholder = function (jquerySelection) {
    this.jquerySelection = jquerySelection;

    return this;
  };

  /* Draws the test tube in the given container space
   *
   *
   * Arguments
   * ---------
   * data:    tube data object
   *
   *
   * Returns
   * -------
   * this
   */
  baseController.prototype.renderView = function () {
    // Pass the update call down to the view
    this.currentView.renderView();

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
  baseController.prototype.release = function () {
    this.currentView.release();

    return this;
  };

  /* Placeholder for future functionality
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
  baseController.prototype.childDone = function (childPtr, action, data) {
    return this;
  };

  return baseController;
});
