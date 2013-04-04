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

  var KitModel = Object.create(BasePageModel);

  $.extend(KitModel, {

    init:function (owner, initData) {
      this.owner = Object.create(owner);
      this.stash_by_BC = {};
      this.stash_by_UUID = {};
      this.labware = undefined;
      this.user = undefined;
      this.batch = undefined;
      this.tubes = [];
      this.spinColumns = [];
      this.availableBarcodes = [];
      this.kitSaved = false;

      this.inputRole = initData["input"];
      this.outputRoleForTube = initData["output"]["tube"];
      this.outputRoleForSC = initData["output"]["spin_column"];

      return this;
    },
    setBatch:function (batch) {
      console.log("setBatch : ", batch);
      this.addResource(batch);
      this.batch = batch;
      this.setAllTubesFromCurrentBatch(); // as in: from the batch, I get the tubes involved...
      this.owner.childDone(this, "batchAdded");
    },
    setAllTubesFromCurrentBatch:function () {
      var that = this;
      this.batch.items.then(function (items) {
          console.log(items);
          _.each(items, function (item) {
            if (item.role === that.inputRole && item.status === "done") {
              _.each(items, function (tube) {
                //if (tube.)
                that.fetchResourcePromiseFromUUID(tube.uuid)
                  .then(function (rsc) {
                    //that.tubes.push(rsc);

                  });
              });
            }
          });

        }
      );
//      this.uuids = this.owner.tubeUUIDs;
    },
    findTubeInModelFromBarcode:function (barcode) {
      for (var i = 0; i < this.tubes.length; i++) {
        if (this.tubes[i].barcode == barcode) return this.tubes[i];
      }

      return null;
    },
    findSCInModelFromBarcode:function (barcode) {
      for (var i = 0; i < this.spinColumns.length; i++) {
        if (this.spinColumns[i].barcode == barcode) return this.spinColumns[i];
      }

      return null;
    },
    validateKitTubes:function (kitType) {
      var valid = true;
      var tubeTypes = [];

      for (var tube in this.tubes) {
        if (this.tubes[tube].hasOwnProperty('aliquots')) {
          if (this.tubes[tube].aliquots.length > 0) {
            tubeTypes.push = this.tubes[tube].aliquots[0].type;
          }
        }
      }

      for (var index in tubeTypes) {
        if (kitType.indexOf(tubeTypes[index]) == -1) {
          valid = false;
          break;
        }
      }
      return valid;
    },
    validateTubeUuid:function (data) {
      var valid = false;

      for (var i = 0; i < this.tubes.length; i++) {
        if (this.tubes[i].uuid == data.uuid) {
          valid = true;
          break;
        }
      }

      return valid;
    },
    validateSCBarcode:function (data) {
      return true;
    },
    getRowModel:function (rowNum) {
      var rowModel = {};

      if (!this.kitSaved) {
        rowModel = {
          "rowNum":rowNum,
          "labware1":{
            "resource":this.tubes[rowNum],
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
      }
      else {
        rowModel = {
          "rowNum":rowNum,
          "labware1":{
            "expected_type":"tube",
            "display_remove":true,
            "display_barcode":true
          },
          "labware2":{
            "expected_type":"spin_columns",
            "display_remove":false,
            "display_barcode":true
          },
          "labware3":{
            "expected_type":"waste_tube",
            "display_remove":false,
            "display_barcode":false
          }
        };
      }

      return rowModel;
    },

    createMissingSpinColumns:function () {
      var that = this;
      var listOfPromises = [];

      _.each(this.tubes, function (tube) {
        var registerLabwarePromise = $.Deferred();
        listOfPromises.push(registerLabwarePromise);

        Operations.registerLabware(
          root.tubes,
          'DNA',
          'stock'
        ).then(function (state) {
            that.stash_by_BC[state.barcode] = state.labware;
            that.stash_by_UUID [state.labware.uuid] = state.labware;
            that.spinColumns.push(state.labware);
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

    makeTransfer:function (source, destination, rowPresenter) {
      var that = this;
      Operations.betweenLabware(root.actions.transfer_tubes_to_tubes, [
        function (operations, state) {
          operations.push({
            input:{ resource:source, role:'inputRole', order:results.get('order') },
            output:{ resource:destination, role:this.outputRoleForSC },
            fraction:0.5,
            aliquot_type:'DNA'
          });
        }
      ]).operation()
        .then(function () {

          // refreshing cache
          that.stash_by_BC[source.labels.barcode] = undefined;
          that.stash_by_UUID[source.uuid] = undefined;
          that.fetchResourcePromiseFromUUID(source.uuid);
          that.stash_by_BC[destination.labels.barcode] = undefined;
          that.stash_by_UUID[destination.uuid] = undefined;
          that.fetchResourcePromiseFromUUID(destination.uuid);

          rowPresenter.childDone("...");
        });
    }
  });

  return KitModel;

})
