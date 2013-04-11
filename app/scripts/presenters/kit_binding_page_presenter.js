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
      "use strict";

      // interface ....
      var KitPresenter = Object.create(BasePresenter);

      $.extend(KitPresenter, {
        register:function (callback) {
          callback('kit_presenter', function (owner, factory, initData) {
            return Object.create(KitPresenter).init(owner, factory, initData);
          });
        },

        init:function (owner, presenterFactory, initData) {
          this.owner = owner;
          this.kitModel = Object.create(KitModel).init(this, initData);
          this.rowPresenters = [];
          this.presenterFactory = presenterFactory;
          return this;
        },

        setupPresenter:function (input_model, jquerySelection) {
          this.tubeTypes = [];
          this.kitModel.setBatch(input_model.batch);
          this.setupPlaceholder(jquerySelection);
          this.setupView();
          this.renderView();
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

        setupSubPresenters:function () {
          if (!this.barcodePresenter) {
            this.barcodePresenter = this.presenterFactory.create('scan_barcode_presenter', this);
          }

          this.kitModel.setupInputPresenters(this);
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

          this.barcodePresenter.setupPresenter(modelJson, jquerySelectionForBarcode);
          this.barcodePresenter.focus();
          this.setValidState();
          return this;
        },

        renderView:function () {
          // render view...
          this.currentView.renderView();

          if (this.barcodePresenter) {
            this.barcodePresenter.renderView();
          }

          return this;
        },

        setValidState:function () {
          var kitType = this.jquerySelection().find('.kitSelect').val();
          var valid = this.kitModel.validateKitTubes(kitType);
          this.currentView.setKitValidState(valid);

          return valid;
        },

        getTubeFromModel:function (requester, barcode) {
          this.kitModel.findInputFromBarcode(barcode).then(function (result) {
            if (!result) {
              requester.displayErrorMessage("Barcode not found");
            } else {
              requester.updateModel(result);
            }
          });
        },

        getSpinColumnFromModel:function (requester, barcode) {

          var result = this.kitModel.findOutputFromBarcode(barcode);
          if (!result) {
            requester.displayErrorMessage("Spin column is not in kit");
          } else {
            requester.updateModel(result);
          }
        },

        release:function () {
          this.currentView.clear();
          return this;
        },

        childDone:function (child, action, data) {

          if (child === this.currentView) {
            if (action === "next") {

              if (this.setValidState()) {
                this.owner.childDone(this, "done", { batch:this.kitModel.batch });

              } else {
                this.owner.childDone(this, "error", {"message":"Error: The kit isn't validated."});
              }

            } else if (action === "savePrintBC") {
              this.kitModel.saveKitCreateBarcodes();
            }
          }

          if (action === "barcodeScanned") {
            var originator = data.origin;
            if (originator.labwareModel.expected_type === "tube") {
              this.getTubeFromModel(originator, data);
            } else if (originator.labwareModel.expected_type === "spin_column") {
              this.getSpinColumnFromModel(originator, data);

              this.kitModel.makeTransfer(
                  child.labware1Presenter.labwareModel.resource,
                  child.labware2Presenter.labwareModel.resource,
                  child
              );
            }
          }

          if (child === this.kitModel) {
            if (action === "labelPrinted") {
              this.owner.childDone(this, "error", {"message":"Kit saved and Spin Column Barcodes printed"});
              this.setupSubPresenters();
              this.currentView.toggleHeaderEnabled(false);
            }
          }

        }

      });

      return KitPresenter;
    });
