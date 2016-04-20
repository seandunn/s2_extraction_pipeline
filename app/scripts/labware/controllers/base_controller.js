//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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

  return baseController;
});
