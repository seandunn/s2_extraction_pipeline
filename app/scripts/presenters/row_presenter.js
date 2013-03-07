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


define(['extraction_pipeline/views/row_view', 'extraction_pipeline/dummyresource', 'labware/presenters/tube_presenter'], function (View, rsc, TubePresenter) {
// TODO: remove me !!!!

  // interface ....
  var tp = function (owner, presenterFactory) {
    this.owner = owner;
    this.currentView = undefined;
    this.presenterFactory = presenterFactory;
    this.labware1Presenter = undefined;
    this.labware2Presenter = undefined;
    this.labware3Presenter = undefined;
    this.rowNum = undefined;
    return this;
  };

  /* Sample model input:
  *
  *{
  * "rowNum" : i,
  * "labware1" : {
  *   "uuid" : this.model[i].uuid,
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
  tp.prototype.setupPresenter = function (input_model, jquerySelection) {
//    console.log("et  : setupPresenter");
    this.setupPlaceholder(jquerySelection);
    this.setupView();

    this.renderView();
    this.updateModel(input_model);
    this.rowNum = input_model.rowNum;

    if (input_model.remove_arrow) {
      this.currentView.removeArrow();
    }

    return this;
  };

  tp.prototype.setupPlaceholder = function (jquerySelection) {
    this.jquerySelection = jquerySelection;
    return this;
  };

  tp.prototype.setupView = function () {
    this.currentView = new View(this, this.jquerySelection);
    console.log(this.currentView);
    return this;
  };

  tp.prototype.updateModel = function (model) {
    this.model = model;
    this.setupSubPresenters();
    return this;
  }

  tp.prototype.setupSubPresenters = function () {
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
  }

  tp.prototype.setupSubModel = function () {
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
  }

  tp.prototype.renderView = function () {
    // render view...
//    console.log("et  : presenter::renderView, ", this.jquerySelection());
    this.currentView.renderView();

    return this;
  };

  tp.prototype.getTubeType = function () {
    var tubeType = '';

    if (this.labware1Presenter) {
      tubeType = this.labware1Presenter.getAliquotType();
    }

    return tubeType;
  }

  tp.prototype.release = function () {
    this.jquerySelection().release();
    return this;
  };

  tp.prototype.isRowComplete = function() {
    var complete = true;

    return complete;
  };

  tp.prototype.childDone = function (child, action, data) {

    if (child instanceof TubePresenter) {
     this.owner.childDone(this, "tubeFinished", data);
    }
  };


  return tp;
});
