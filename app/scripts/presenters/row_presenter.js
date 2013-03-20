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


define([
  'extraction_pipeline/views/row_view'
  , 'labware/presenters/tube_presenter'
  , 'extraction_pipeline/presenters/base_presenter'
], function (View, TubePresenter, BasePresenter) {

  var RowModel = Object.create(null);
  $.extend(RowModel, {
    init:function (owner) {
      this.owner = owner;
      this.labware1Presenter = undefined;
      this.labware2Presenter = undefined;
      this.labware3Presenter = undefined;

      // TODO: check whether anything else required

      return this;
    }
  });

  var RowPresenter = Object.create(BasePresenter);

  // interface ....
//  var tp = function (owner, presenterFactory) {
//    this.owner = owner;
//    this.currentView = undefined;
//    this.presenterFactory = presenterFactory;
//    
//    this.rowNum = undefined;
//    return this;
//  };

  /* Sample model input:
   *
   *{
   * "rowNum" : i,
   * "labware1" : {
   *   "uuid" : this.model[i],
   *   "expected_type" : "tube",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * },
   * "labware2" : {
   *   "expected_type" : "spin_columns",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * },
   * "labware3" : {
   *   "expected_type" : "waste_tube",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * }
   *};
   */

  $.extend(RowPresenter, {
    setupPresenter:function (input_model, jquerySelection) {
      this.setupPlaceholder(jquerySelection);

      this.updateModel(input_model);
      this.rowNum = input_model.rowNum;

      if (input_model.remove_arrow) {
        this.currentView.removeArrow();
      }
      this.setupView();
      this.setupSubPresenters();

      return this;
    },

    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    setupView:function () {
      this.currentView = new View(this, this.jquerySelection);
      return this;
    },

    updateModel:function (model) {
      this.model = model;
      return this;
    },

    setupSubPresenters:function () {
      if (!this.labware1Presenter && this.model.hasOwnProperty('labware1')) {
        this.labware1Presenter = this.presenterFactory.createLabwarePresenter(this);
      }
      if (!this.labware2Presenter && this.model.hasOwnProperty('labware2')) {
        this.labware2Presenter = this.presenterFactory.createLabwarePresenter(this);
      }
      if (!this.labware3Presenter && this.model.hasOwnProperty('labware3')) {
        this.labware3Presenter = this.presenterFactory.createLabwarePresenter(this);
      }

      // TODO: for now, the tube is always the same... no use of the mapper

      this.setupSubModel();

      return this;
    },

    setupSubModel:function () {
      var that = this;

      var jquerySelectionForLabware1 = function () {
        return that.jquerySelection().find('.labware1')
      };

      var jquerySelectionForLabware2 = function () {
        return that.jquerySelection().find('.labware2')
      };

      var jquerySelectionForLabware3 = function () {
        return that.jquerySelection().find('.labware3')
      };

      if (this.labware1Presenter) {
        this.labware1Presenter.setupPresenter(this.model.labware1, jquerySelectionForLabware1);
      }
      if (this.labware2Presenter) {
        this.labware2Presenter.setupPresenter(this.model.labware2, jquerySelectionForLabware2);
      }
      if (this.labware3Presenter) {
        this.labware3Presenter.setupPresenter(this.model.labware3, jquerySelectionForLabware3);
      }
      return this;
    },

    renderView:function () {
      // render view...
      this.currentView.renderView();
      if (this.labware1Presenter)
        this.labware1Presenter.renderView();
      if (this.labware2Presenter) {
        debugger;
        this.labware2Presenter.renderView();
      }
      if (this.labware3Presenter)
        this.labware3Presenter.renderView();
      return this;
    },

    getTubeType:function () {
      var tubeType = '';

      if (this.labware1Presenter) {
        tubeType = this.labware1Presenter.getAliquotType();
      }

      return tubeType;
    },

    release:function () {
      this.jquerySelection().release();
      return this;
    },

    isRowComplete:function () {
      var complete = false;

      if (this.labware1Presenter.isComplete() &&
        this.labware2Presenter.isComplete() &&
        this.labware3Presenter.isComplete()) {
        complete = true;
      }

      return complete;
    },

    childDone:function (child, action, data) {

      if (action == "tube rendered") {
        this.owner.childDone(this, "tubeFinished", data);
      } else if (action == "barcodeScanned") {
        this.validateUuid(child, data);
      }
    }
  });

  return RowPresenter;

});
