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


define(['extraction_pipeline/views/binding_complete_page_view',
        'extraction_pipeline/presenters/base_presenter',
        'extraction_pipeline/models/binding_complete_model'
], function (View, BasePresenter, BindingCompleteModel) {

  var BindingCompletePresenter = Object.create(BasePresenter);

  $.extend(BindingCompletePresenter, {

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
  setupPresenter:function (input_model, jquerySelection) {
    this.tubeTypes = [];
    this.model = Object.create(BindingCompleteModel).init(this);
    this.model.dirtySetTubes();
    this.setupPlaceholder(jquerySelection);
    this.setupView();
    this.renderView();
    this.setupSubPresenters();
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
    if (!this.barcodePresenter) {
      this.barcodePresenter = this.presenterFactory.createScanBarcodePresenter(this);
    }
    for (var i = 0; i < this.model.tubes.length; i++) {
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

    for (var i = 0; i < this.model.tubes.length; i++) {

      var jquerySelectionForRow = function (i) {
        return function () {
          return that.jquerySelection().find('.row' + i);
        }
      }

      var rowModel = {
        "rowNum":i,
        "remove_arrow":true,
        "labware1":{
          "expected_type":"tube",
          "display_remove":true,
          "display_barcode":true
        },
        "labware2":{
          "expected_type":"spin_columns",
          "display_remove":true,
          "display_barcode":true
        },
        "labware3":{
          "expected_type":"waste_tube",
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

    return complete;
  },

  /* Ensure that the user entered UUID matches the expected list
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
  validateUuid:function (child, data) {
    var valid = false;

    for (var i = 0; i < this.model.tubes.length; i++) {
      if (this.model.tubes[i].uuid == data.uuid) {
        valid = true;
        break;
      }
    }

    return valid;
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

    if (action == 'bindingComplete') {
      if (this.checkPageComplete()) {
        this.owner.childDone(this, 'error', {"message":"childDone not hooked up to workflow engine"});
      } else {
        this.owner.childDone(this, 'error', {"message":"The page has not been completed"});
      }
    }

  }

});

  return BindingCompletePresenter;
})
;
