/*
 * S2 - An open source lab information management systems (LIMS)
 * Copyright (C) 2013  Wellcome Trust Sanger Insitute
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 1, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston MA  02110-1301 USA
 */

define(['extraction_pipeline/views/elution_page_view',
  'extraction_pipeline/presenters/base_presenter',
  'extraction_pipeline/models/elution_model'
], function (View, BasePresenter, ElutionModel) {

  var ElutionLoadingPresenter = Object.create(BasePresenter);

  $.extend(ElutionLoadingPresenter, {
    register:function (callback) {
      callback('elution_presenter', function (owner, factory, initData) {
        return Object.create(ElutionLoadingPresenter).init(owner, factory, initData);
      });
    },

    /* Initialises the presenter and defines the view to be used
     *
     *
     * Arguments
     * ---------
     * input_model:     The input model containing the current pipeline state
     *
     * jquerySelection: The selector method for the HTML container this presenter is responsible for
     *
     *
     * Returns
     * -------
     * this
     */
    // interface ....
    init:function (owner, presenterFactory, initData) {
      this.owner = owner;
      this.elutionModel = Object.create(ElutionModel).init(this, initData);
      this.rowPresenters = [];
      this.presenterFactory = presenterFactory;
      return this;
    },

    setupPresenter:function (input_model, jquerySelection) {
      this.setupPlaceholder(jquerySelection);
      this.elutionModel.setBatch(input_model.batch);
      this.setupView();
      this.renderView();
      this.setupSubPresenters();

      return this;
    },

    /* Sets the container selector method for the presenter
     *
     *
     * Arguments
     * ---------
     * jquerySelection: The selector method for the presenter
     *
     *
     * Returns
     * -------
     * this
     */
    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    /* Sets up the presenters view
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
    setupView:function () {
      this.currentView = new View(this, this.jquerySelection);
      return this;
    },

    /* Sets up any subpresenters to be displayed in this instance
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
    setupSubPresenters:function () {
      this.elutionModel.setupInputPresenters();
      this.setupSubModel();
      return this;
    },

    /* Delegates the models for the subpresenters
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
    setupSubModel:function () {
      return this;
    },

    /* Renders the current view and its internal placeholders
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
    renderView:function () {
      // render view...
      this.currentView.renderView();
      return this;
    },

    /* Checks if all of the pages tasks have been completed before moving forward in the pipeline
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
    checkPageComplete:function () {
      for (var i = 0; i < this.rowPresenters.length; i++) {
        if (!this.rowPresenters[i].isRowComplete()) {
          return false;
        }
      }
      return true;
    },

    /* Clears the current view and all of its children
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
    release:function () {
      this.currentView.clear();
      return this;
    },

    makeAllTransfers:function () {

      var destBySrc = _.chain(this.rowPresenters).reduce(function (memo, presenter) {
        memo[presenter.labware1Presenter.labwareModel.resource.uuid] = {
          source:presenter.labware1Presenter.labwareModel.resource,
          destination:presenter.labware2Presenter.labwareModel.resource
        };
        return memo
      }, {}).value();

      this.elutionModel.makeAllTransfers(destBySrc);
    },

    /* Indicates a child has completed an action
     *
     *
     * Arguments
     * ---------
     * child:     The child that has completed
     * action:    The action completed
     * data:      Supplementary data to the completed action
     *
     *
     * Returns
     * -------
     * this
     */
    childDone:function (child, action, data) {

      if (child === this.currentView) {

        if (action === 'elutionStarted') {
            if (this.checkPageComplete()) {
              this.makeAllTransfers();
              this.owner.childDone(this, "error", {"message":"Elution started"});
            }
        } else if (action === 'printOutputTubeBC') {

          if (!this.elutionModel.hasStarted()) {
            this.elutionModel.createOutputs();
            this.currentView.setPrintButtonEnabled(false);
          }

        }

      } else if (child === this.elutionModel) {

        if (action === "allTransferCompleted") {
          this.owner.childDone(this, "error", {"message":"Elution done"});
//          this.owner.childDone(this, "done", {"batch":this.elutionModel.batch});
        }

      } else { // if child is a row presenter....

        if (action === "barcodeScanned") {
          var originator = data.origin;
          if (originator.labwareModel.expected_type === "tube") {
            this.elutionModel.getOutputByBarcode(originator, data);
          } else if (originator.labwareModel.expected_type === "spin_column") {
            this.elutionModel.getInputByBarcode(originator, data);
          }
        }

      }
    }
  });

  return ElutionLoadingPresenter;
})
;
