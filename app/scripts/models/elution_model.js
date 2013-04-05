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

"use strict";

define([
  'extraction_pipeline/models/base_page_model',
  'mapper/operations'
], function (BasePageModel, Operations) {

  var ElutionModel = Object.create(BasePageModel);

  $.extend(ElutionModel, {
    //TODO: add suitable methods for the model

    init:function (owner) {
      this.owner = Object.create(owner);
      this.stash_by_BC = {};
      this.stash_by_UUID = {};
      this.labware = undefined;
      this.user = undefined;
      this.batch = undefined;
      this.spin_columns = [];
      this.availableBarcodes = [];
      this.kitSaved = false;
      this.dirtySetSpinColumns();
      return this;
    },
    setBatch:function (batch) {
      console.log("setBatch : ", batch);
      this.addResource(batch);
      this.batch = batch;
      this.dirtySetTubes(); // as in: from the batch, I get the tubes involved...
      this.owner.childDone(this, "batchAdded");
    },
    dirtySetSpinColumns:function () {
      var that = this;
//      this.setTestData(dataJSON);
      this.fetchResourcePromiseFromBarcode("1220017279667")
        .then(function (rsc) {
          that.spin_columns.push(rsc);
          that.spin_columns.push(rsc);
          that.spin_columns.push(rsc);
          that.spin_columns.push(rsc);
        });
//      this.uuids = this.owner.tubeUUIDs;
    },
    createMissingSpinColumnBarcodes:function(){
      var that = this;
      this.barcodes = []
      for (var tube in that.tubes){
        // TODO: create a spin column barcode for every tube

        // generate SC barcodes

        // save the barcodes
        this.barcodes.push(); // barcodes!


        // use tube and BC to generate SC
//        var spinColumn = this.owner.getS2Root().spin
      }
    },
    validateSpinColumnUuid:function (data) {
      var valid = false;

      for (var i = 0; i < this.spin_columns.length; i++) {
        if (this.spin_columns[i].uuid == data.uuid) {
          valid = true;
          break;
        }
      }

      return valid;
    },
    validateSCBarcode:function(data) {
      return true;
    },
    getRowModel:function (rowNum) {
      var rowModel = {};

      rowModel = {
        "rowNum":rowNum,
        "remove_arrow":false,
        "labware1":{
          "expected_type":"spin_columns",
          "display_remove":true,
          "display_barcode":true
        },
        "labware2":{
          "expected_type":"tube",
          "display_remove":true,
          "display_barcode":true
        }
      };

      return rowModel;
    },

    createOutputTubes:function () {
      var that = this;
      var listOfPromises = [];

      _.each(this.spin_columns, function (tube) {
        var registerLabwarePromise = $.Deferred();
        listOfPromises.push(registerLabwarePromise);

        Operations.registerLabware(
          root.tubes,
          'DNA',
          'stock'
        ).then(function (state) {
            that.stash_by_BC[state.barcode] = state.labware;
            that.stash_by_UUID [state.labware.uuid] = state.labware;
            that.availableBarcodes.push(state.barcode);
            registerLabwarePromise.resolve();
          }).fail(function () {
            registerLabwarePromise.reject();
            that.owner.childDone(that, "failed", {});
          });
      });

      $.when.apply(listOfPromises).then(function () {
        that.owner.childDone(that, "success", {});
      }).fail(function () {
          that.owner.childDone(that, "failed", {});
        });
    },

    makeTransfer:function (source, destination_Tube_BR, index) {
      var root, that = this;
      var spinColumn;
      this.owner.getS2Root()
        .then(function (r) {
          root = r;
          // creates sc with the given BC
          return SC.creates();
//          return {}; //...
        })
        .then(function (sc) {
          spinColumn = sc;

          return root.tube_spin_column_transfers.new({"source":source, "destination":sc});
        })
        .then(function () {
          return source.order();
        })
        .then(function (ord) {
          return ord.updateRole(source, {event:"complete"});
        })
        .then(function (ord) {
          return ord.updateRole(spinColumn, {event:"complete"});
        })
        .then(function () {
          that.owner.childDone(that, "modelUpdated", {index:index});
        })
        .fail(function () {
          // ...
        });
    },
    checkPageComplete:function() {
      return true;
  }
  });

  return ElutionModel;

})
