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


define(['extraction_pipeline/views/binding_finished_page_view',
  'extraction_pipeline/presenters/base_presenter',
  'extraction_pipeline/models/binding_finished_model',
  'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction_2.json'
], function (View, BasePresenter, BindingFinishedModel, dataJSON) {

  var BindingFinishedPresenter = Object.create(BasePresenter);

  $.extend(BindingFinishedPresenter, {

    // interface ....
    init:function (owner, presenterFactory) {
      this.owner = owner;
      this.currentView = undefined;
      this.barcodePresenter = undefined;
      this.rowPresenters = [];
      this.tubeTypes = [];
      this.presenterFactory = presenterFactory;
      return this;
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

    //TODO: Binding finished model needs to be implemented properly

    setupPresenter:function (input_model, jquerySelection) {
//    console.log("et  : setupPresenter");
      this.tubeTypes = [];
      this.model = Object.create(BindingFinishedModel).init(this);
      this.setupPlaceholder(jquerySelection);
      this.setupView();
      this.renderView();
      this.updateModel(input_model);
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
      console.log(this.currentView);
      return this;
    },

    /* Updates the presenters model and delegates to subpresenters
     *
     *
     * Arguments
     * ---------
     * model:     The model to be used by the presenter to display data
     *
     *
     * Returns
     * -------
     * this
     */
    updateModel:function (model) {
      if (model.hasOwnProperty('tubes')) {
        this.model = model.tubes;
      }

      var uuids = this.owner.tubeUUIDs;
      this.model = uuids;
      this.numRows = this.model.length;
      this.setupSubPresenters();
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
      if (!this.barcodePresenter) {
        this.barcodePresenter = this.presenterFactory.createScanBarcodePresenter(this);
      }
      for (var i = 0; i < this.numRows; i++) {
        if (!this.rowPresenters[i]) {
          this.rowPresenters[i] = this.presenterFactory.createRowPresenter(this);
        }
      }
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
      var modelJson = {"type":"Kit",
        "value":"Kit0001"}
      var that = this;
      var jquerySelectionForBarcode = function () {
        return that.jquerySelection().find('.barcode')
      }

      for (var i = 0; i < this.numRows; i++) {

        var jquerySelectionForRow = function (i) {
          return function () {
            return that.jquerySelection().find('.row' + i);
          }
        }

        var rowModel = {
          "rowNum":i,
          "remove_arrow":false,
          "labware1":{
            "expected_type":"spin_columns",
            "display_remove":false,
            "display_barcode":false
          },
          "labware2":{
            "expected_type":"tube",
            "display_remove":false,
            "display_barcode":false
          }
        };

        this.rowPresenters[i].setupPresenter(rowModel, jquerySelectionForRow(i));
      }
      this.barcodePresenter.setupPresenter(modelJson, jquerySelectionForBarcode);
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
//    console.log("et  : presenter::renderView, ", this.jquerySelection());
      this.currentView.renderView();
      if (this.barcodePresenter) {
        this.barcodePresenter.renderView();
      }
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

      var complete = true;

      for (var i = 0; i < this.rowPresenters.length; i++) {
        if (!this.rowPresenters[i].isRowComplete()) {
          complete = false;
          break;
        }
      }

      //TODO: Add check that tube barcodes have been printed

      return complete;
    },

    /* Creates and prints the required barcodes
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
    printBarcodes:function () {
      alert("Not implemented!");
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
      this.jquerySelection().release();
      return this;
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

      if (action == 'bindingFinished') {
        if (this.checkPageComplete()) {
          this.owner.childComplete(this, 'bindingFinished', {});
        }
      }
      else if (action == 'printBarcodes') {
        this.printBarcodes();
      }

    }

  });


  return BindingFinishedPresenter;
});
