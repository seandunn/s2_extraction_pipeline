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

define(['extraction_pipeline/views/kit_binding_page_view'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/models/kit_binding_model'
],
    function (View, BasePresenter, KitModel) {
      // interface ....
      var KitPresenter = Object.create(BasePresenter);

      $.extend(KitPresenter, {
        init:                  function (owner, presenterFactory, initData) {
          this.owner = owner;
          this.kitModel = Object.create(KitModel).init(this, initData);
          this.currentView = undefined;
          this.barcodePresenter = undefined;
          this.rowPresenters = [];
          this.tubeTypes = [];
          this.presenterFactory = presenterFactory;
          return this;
        },
        setupPresenter:        function (input_model, jquerySelection) {
          this.tubeTypes = [];
          this.kitModel.setBatch(input_model.batch);
          this.setupPlaceholder(jquerySelection);
          this.setupView();
          this.renderView();
          this.setupSubPresenters();
          this.setValidState();

          // for test : make a transfer HERE
          var that = this;
          this.kitModel.createMissingSpinColumns().then(function () {
            that.kitModel.makeTransfer(that.kitModel.tubes[0], that.kitModel.spinColumns[0], that.rowPresenters[0]);
          });

          return this;
        },
        setupPlaceholder:      function (jquerySelection) {
          this.jquerySelection = jquerySelection;
          return this;
        },
        setupView:             function () {
          this.currentView = new View(this, this.jquerySelection);
          return this;
        },
        setupSubPresenters:    function () {
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
        setupSubModel:         function () {
          var modelJson = {
            "type": "Kit",
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

            var rowModel = this.kitModel.getRowModel(i);
            this.rowPresenters[i].setupPresenter(rowModel, jquerySelectionForRow(i));
          }
          this.barcodePresenter.setupPresenter(modelJson, jquerySelectionForBarcode);
          return this;
        },
        renderView:            function () {
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
        setValidState:         function () {

          var kitType = this.jquerySelection().find('.kitSelect').val().split('/');
          var valid = this.kitModel.validateKitTubes(kitType);
          this.currentView.setKitValidState(valid);

          return valid;
        },
        getTubeFromModel:      function (requester, barcode) {

          var result = this.kitModel.findTubeInModelFromBarcode(barcode);
          if (result == null) {
            requester.displayErrorMessage("Barcode not found");
          }
          else {
            requester.displaySuccessMessage("Tube found");
            requester.setupLabware1Model(result);
          }
        },
        getSpinColumnFromModel:function (requester, barcode) {

          var result = this.kitModel.findSCInModelFromBarcode(barcode);
          if (result == null) {
            requester.displayErrorMessage("Spin column is not in kit");
          }
          else {
            requester.displaySuccessMessage("Spin column found");
            requester.setupLabware2Model(result);
            this.kitModel.makeTransfer(requester.labware1, requester.labware2, requester);
          }
        },
        release:               function () {
          this.currentView.clear();
          return this;
        },
        childDone:             function (child, action, data) {

          if (child === this.currentView) {
            if (action == "next") {
              if (this.setValidState()) {
//              console.warn("CALL TO S2MAPPER: KIT VERIFIED");
//              var dataForOwner = {
//                batchUUID:this.batchUUID,
//                HACK:"HACK"
//              };
//              this.owner.childDone(this, "done", dataForOwner);
              } else {
                this.owner.childDone(this, "error", {"message":"Error: The kit isn't validated."});
              }
            } else if (action == "printBC") {
              this.kitModel.kitSaved = true;
              this.kitModel.createMissingSpinColumns();
              // TODO : print call here !
              this.owner.childDone(this, "error", {"message":"Spin Column Barcodes printed"});
              this.setupSubPresenters();
              this.currentView.toggleHeaderEnabled(false);
            }
          } else if (action == "printBC") {
            this.kitModel.kitSaved = true;
            this.kitModel.createMissingSpinColumns();
            this.owner.childDone(this, "error", {"message":"Spin Column Barcodes printed"});
            this.setupSubPresenters();
            this.currentView.toggleHeaderEnabled(false);
          }

          if (action == 'tubeFinished') {
            this.tubeTypes.push(data);

            if (this.tubeTypes.length == this.numRows) {
              this.setValidState();
            }
          } else if (action == "barcodeScanned") {
            if (child.labwareModel.expected_type == "tube") {
              this.getTubeFromModel(child, data);
            } else if (child.labwareModel.expected_type == "spin_columns") {
              this.getSpinColumnFromModel(child, data);
            }
          }
        }

      });

      return KitPresenter;
    }
);
