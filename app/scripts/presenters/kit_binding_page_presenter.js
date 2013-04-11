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
       'extraction_pipeline/presenters/connected_presenter',
       'extraction_pipeline/views/kit_binding_page_view',
       'extraction_pipeline/models/kit_binding_model'
], function (ConnectedPresenter, View, Model) {
  "use strict";

  var Presenter = BasePresenter.extend('kit_presenter', Model, View);

  $.extend(Presenter, {
    setupSubModel:function () {
      if (!this.barcodePresenter) {
        this.barcodePresenter = this.presenterFactory.create('scan_barcode_presenter', this);
      }

      var that = this;
      this.barcodePresenter.setupPresenter({
        type: "Kit",
        value: "Kit0001"
      }, function() {
        return that.jquerySelection().find('.barcode')
      });
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
      var valid = this.model.validateKitTubes(kitType);
      this.currentView.setKitValidState(valid);

      return valid;
    },

    currentViewDone: function(child, action, data) {
      if (action === "next") {
        if (this.setValidState()) {
          this.owner.childDone(this, "done", { batch:this.model.batch });
        } else {
          this.owner.childDone(this, "error", {"message":"Error: The kit isn't validated."});
        }
      } else if (action === "savePrintBC") {
        this.model.saveKitCreateBarcodes();
      }
    },

    outputDone: function(child, action, data) {
      this.model.makeTransfer(
        child.labware1Presenter.labwareModel.resource,
        child.labware2Presenter.labwareModel.resource,
        child
      );
    },

    modelDone: function(child, action, data) {
      if (action === "labelPrinted") {
        this.owner.childDone(this, "error", {"message":"Kit saved and Spin Column Barcodes printed"});
        this.setupSubPresenters();
        this.currentView.toggleHeaderEnabled(false);
      } else if (action === "allTransferCompleted") {
        this.fetchResourcePromiseFromUUID(data.transfers[0].source.uuid);
        this.fetchResourcePromiseFromUUID(data.transfers[0].destination.uuid);
      }
    }
  });

  return Presenter;
});
