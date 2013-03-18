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


define(['extraction_pipeline/views/binding_finished_page_view'], function (View) {
  // interface ....
  var tp = function (owner, presenterFactory) {
    this.owner = owner;
    this.currentView = undefined;
    this.barcodePresenter = undefined;
    this.rowPresenters = [];
    this.tubeTypes = [];
    this.presenterFactory = presenterFactory;
    return this;
  };

  /* Sample input model for the kit presenter
   *{
   *  "tubes" : [
   *   {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"},
   *    {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"},
   *    {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"},
   *    {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"}
   *  ]
   *}
   */
  tp.prototype.setupPresenter = function (input_model, jquerySelection) {
//    console.log("et  : setupPresenter");
    this.tubeTypes = [];
    this.setupPlaceholder(jquerySelection);
    this.setupView();
    this.renderView();
    this.updateModel(input_model);
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
    if (model.hasOwnProperty('tubes')) {
      this.model = model.tubes;
    }

    var uuids = this.owner.tubeUUIDs;
    this.model = uuids;
    this.numRows = this.model.length;
    this.setupSubPresenters();
    return this;
  }

  tp.prototype.setupSubPresenters = function () {
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
  }

  tp.prototype.setupSubModel = function () {
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
  }

  tp.prototype.renderView = function () {
    // render view...
//    console.log("et  : presenter::renderView, ", this.jquerySelection());
    this.currentView.renderView();
    if (this.barcodePresenter) {
      this.barcodePresenter.renderView();
    }
    return this;
  };

  tp.prototype.checkPageComplete = function() {

    var complete = true;

    for (var i = 0; i < this.rowPresenters.length; i++) {
      if (!this.rowPresenters[i].isRowComplete()) {
        complete = false;
        break;
      }
    }

    //TODO: Add check that tube barcodes have been printed

    return complete;
  };

  tp.prototype.printBarcodes = function() {
    alert("Not implemented!");
  };

  tp.prototype.release = function () {
    this.jquerySelection().release();
    return this;
  };

  tp.prototype.childDone = function (child, action, data) {

    if (action == 'bindingFinished') {
      if (this.checkPageComplete()) {
        this.owner.childComplete(this, 'bindingFinished', {});
      }
    }
    else if (action == 'printBarcodes') {
      this.printBarcodes();
    }

  };

  return tp;
})
;
