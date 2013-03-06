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


define(['extraction_pipeline/views/row_view', 'extraction_pipeline/dummyresource'], function (View, rsc) {
// TODO: remove me !!!!

  // interface ....
  var tp = function (owner, presenterFactory) {
    this.owner = owner;
    this.currentView = undefined;
    this.spinColumnBarcodePresenter = undefined;
    this.presenterFactory = presenterFactory;
    this.tubePresenter = undefined;
    this.wasteTubePresenter = undefined;
    this.spinColumnPresenter = undefined;
    this.rowNum = undefined;
    this.done = 0;
    return this;
  };


  tp.prototype.setupPresenter = function (input_model, jquerySelection) {
//    console.log("et  : setupPresenter");
    this.done = 0;
    this.setupPlaceholder(jquerySelection);
    this.setupView();
    this.renderView();
    this.updateModel(input_model);
    this.rowNum = input_model.rowNum;
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
    if (!this.tubePresenter) {
      this.tubePresenter = this.presenterFactory.createTubePresenter(this);
    }
    if (!this.spinColumnPresenter) {
      this.spinColumnPresenter = this.presenterFactory.createSpinColumnPresenter(this);
    }
    if (!this.wasteTubePresenter) {
      this.wasteTubePresenter = this.presenterFactory.createTubePresenter(this);
    }
    if (!this.spinColumnBarcodePresenter) {
      this.spinColumnBarcodePresenter = this.presenterFactory.createScanBarcodePresenter(this);
    }

    // TODO: for now, the tube is always the same... no use of the mapper

    this.setupSubModel();

    return this;
  }

  tp.prototype.setupSubModel = function () {
    var tubeBC = { "url" : "components/s2-api-examples/tube.json" };
    var spinColumnBC = { "url" : "components/s2-api-examples/spin_column.json" };
    var that = this;
    var scBarcodeJson = {"type":"SC",
      "value":"SC0001"};
    var that = this;
    var jquerySelectionForBarcode = function () {
      return that.jquerySelection().find('.spinColumnBarcode')
    };

    var jquerySelectionForTube = function () {
      return that.jquerySelection().find('.tube')
    };

    var jquerySelectionForWasteTube = function () {
      return that.jquerySelection().find('.wasteTube')
    };

    var jquerySelectionForSpinColumn = function () {
      return that.jquerySelection().find('.spinColumn')
    };

    this.tubePresenter.setupPresenter(tubeBC, jquerySelectionForTube);
    this.spinColumnPresenter.setupPresenter(spinColumnBC, jquerySelectionForSpinColumn);
    this.wasteTubePresenter.drawWasteTube(jquerySelectionForWasteTube);
    this.spinColumnBarcodePresenter.setupPresenter(scBarcodeJson, jquerySelectionForBarcode);

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

    if (this.tubePresenter) {
      tubeType = this.tubePresenter.getAliquotType();
    }

    return tubeType;
  }

  tp.prototype.release = function () {
    this.jquerySelection().release();
    return this;
  };

  tp.prototype.childDone = function (child, action, data) {

    if (child === this.tubePresenter) {
     this.owner.childDone(this, "tubeFinished", this.getTubeType());
    }
  };


  return tp;
});
