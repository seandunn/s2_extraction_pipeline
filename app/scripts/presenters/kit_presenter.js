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


define(['extraction_pipeline/views/kit_view'], function (View) {
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
    return this;
  };

  tp.prototype.updateModel = function (model) {
    if (model.hasOwnProperty('batchUUID')) {

      // TODO: get the uuids from the batchUUID
      var uuids = this.owner.tubeUUIDs;
      this.batchUUID = model.batchUUID;
      this.model = uuids; // list of uuids...
      this.numRows = this.model.length;
      this.setupSubPresenters();
    }
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
    var modelJson = {
      "type":"Kit",
      "value":"Kit0001"
    };
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
        "labware1":{
          "uuid":this.model[i].uuid,
          "expected_type":"tube",
          "display_remove":false,
          "display_barcode":false
        },
        "labware2":{
          "expected_type":"spin_columns",
          "display_remove":false,
          "display_barcode":false
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
  }

  tp.prototype.renderView = function () {
    // render view...
    this.currentView.renderView();
    if (this.barcodePresenter) {
      this.barcodePresenter.renderView();
    }
    return this;
  };

  tp.prototype.validateKitTubes = function () {
    var valid = true;
    var kitType = this.jquerySelection().find('.kitSelect').val();

    for (var index in this.tubeTypes) {
      if (this.tubeTypes[index] != kitType) {
        valid = false;
        break;
      }
    }

    this.currentView.setKitValidState(valid);

    return this;
  };

  tp.prototype.release = function () {
    this.currentView.clear();
    return this;
  };

  tp.prototype.childDone = function (child, action, data) {

    if (child === this.currentView) {
      if (action == "next") {
        console.warn("CALL TO S2MAPPER: KIT VERIFIED");
        var dataForOwner = {
          batchUUID:this.batchUUID,
          HACK:"HACK"
        };
        this.owner.childDone(this, "done", dataForOwner);
      }
    }

    if (action == 'tubeFinished') {
      this.tubeTypes.push(data);

      if (this.tubeTypes.length == this.numRows) {
        this.validateKitTubes();
      }
    }

  };

  return tp;
})
;
