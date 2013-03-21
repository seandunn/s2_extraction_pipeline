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


define(['extraction_pipeline/views/kit_view'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/models/kit_model'
],
  function (View, BasePresenter, KitModel) {
    // interface ....
    var KitPresenter = Object.create(BasePresenter);

    $.extend(KitPresenter, {
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
      init:function (owner, presenterFactory) {
        this.owner = owner;
        this.currentView = undefined;
        this.barcodePresenter = undefined;
        this.rowPresenters = [];
        this.tubeTypes = [];
        this.presenterFactory = presenterFactory;
        return this;
      },
      setupPresenter:function (input_model, jquerySelection) {
        this.tubeTypes = [];
        this.kitModel = Object.create(KitModel).init(this);
        // TODO: Replace the dirty setTubes with a clean method
        this.kitModel.dirtySetTubes();
        this.setupPlaceholder(jquerySelection);
        this.setupView();
        this.renderView();
        this.setupSubPresenters();
        this.setValidState();
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
      setupSubPresenters:function () {
        if (!this.barcodePresenter) {
          this.barcodePresenter = this.presenterFactory.createScanBarcodePresenter(this);
        }
        for (var i = 0; i < this.kitModel.tubes.length; i++) {
          if (!this.rowPresenters[i]) {
            this.rowPresenters[i] = this.presenterFactory.createRowPresenter(this);
          }
        }
        this.setupSubModel();
        return this;
      },
      setupSubModel:function () {
        var modelJson = {
          "type":"Kit",
          "value":"Kit0001"
        };
        var that = this;
        var jquerySelectionForBarcode = function () {
          return that.jquerySelection().find('.barcode')
        }
        for (var i = 0; i < this.kitModel.tubes.length; i++) {

          var jquerySelectionForRow = function (i) {
            return function () {
              return that.jquerySelection().find('.row' + i);
            }
          }

          var rowModel = {
            "rowNum":i,
            "labware1":{
              "resource":this.kitModel.tubes[i],
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
      },
      renderView:function () {
        // render view...
        this.currentView.renderView();
        if (this.barcodePresenter) {
          this.barcodePresenter.renderView();
        }
//      for (var i = 0; i < this.kitModel.tubes.length; i++) {
//        if (this.rowPresenters[i]) {
//          this.rowPresenters[i].renderView();
//        }
//      }
        return this;
      },
      setValidState:function () {

        var kitType = this.jquerySelection().find('.kitSelect').val().split('/');
        var valid = this.kitModel.validateKitTubes(kitType);
        this.currentView.setKitValidState(valid);

        return valid;
      },
      release:function () {
        this.currentView.clear();
        return this;
      },
      childDone:function (child, action, data) {

        if (child === this.currentView) {
          if (action == "next") {
            if (this.setValidState()) {
              console.warn("CALL TO S2MAPPER: KIT VERIFIED");
              var dataForOwner = {
                batchUUID:this.batchUUID,
                HACK:"HACK"
              };
              this.owner.childDone(this, "done", dataForOwner);
            } else {
              this.owner.childDone(this, "error", {"message":"Error: The kit isn't validated."});
            }
          }
        }

        if (action == 'tubeFinished') {
          this.tubeTypes.push(data);

          if (this.tubeTypes.length == this.numRows) {
            this.setValidState();
          }
        }
      }

    });

    return KitPresenter;
  }
);
