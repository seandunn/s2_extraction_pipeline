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
    //TODO: add suitable methods for the model

    init:                           function (owner, initData) {
      this.owner = Object.create(owner);
      this.stash_by_BC = {};
      this.stash_by_UUID = {};
      this.labware = undefined;
      this.user = undefined;
      this.batch = undefined;
      this.tubes = [];
      this.availableBarcodes = [];
      this.kitSaved = false;

      this.inputRole = "binding_tube_to_be_extracted_na+p" || initData["inputRole"] || "binding_tube_to_be_extracted";
      this.outputRoleForTube = "binding_tube_to_be_extracted_na+p" || initData["outputRoles"]["tube"];
      this.outputRoleForSC = "binding_tube_to_be_extracted_na+p" || initData["outputRoles"]["spin_column"];

      return this;
    },
    setBatch:                       function (batch) {
      console.log("setBatch : ", batch);
      this.addResource(batch);
      this.batch = batch;
      this.setAllTubesFromCurrentBatch(); // as in: from the batch, I get the tubes involved...
      this.owner.childDone(this, "batchAdded");
    },
    setAllTubesFromCurrentBatch:    function () {
      var that = this;
      this.batch.items.then(function (items) {
            _.each(items, function (item) {
              if (item.role === that.inputRole && item.status === "done") {
                  that.fetchResourcePromiseFromUUID(item.uuid)
                      .then(function (rsc) {
                        that.addResource(rsc);
                        that.tubes.push(rsc);
                      });
                }
            });
          }
      );
//      this.uuids = this.owner.tubeUUIDs;
    },
    createMissingSpinColumnBarcodes:function () {
      var that = this;
      this.barcodes = []
      for (var tube in that.tubes) {
        // TODO: create a spin column barcode for every tube

        // generate SC barcodes

        // save the barcodes
        this.barcodes.push(); // barcodes!

        // use tube and BC to generate SC
//        var spinColumn = this.owner.getS2Root().spin
      }
    },
    validateKitTubes:               function (kitType) {
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
    validateTubeUuid:               function (data) {
      var valid = false;

      for (var i = 0; i < this.tubes.length; i++) {
        if (this.tubes[i].uuid == data.uuid) {
          valid = true;
          break;
        }
      }

      return valid;
    },
    validateSCBarcode:              function (data) {
      return true;
    },
    getRowModel:                    function (rowNum) {
      var rowModel = {};

      if (!this.kitSaved) {
        rowModel = {
          "rowNum":  rowNum,
          "labware1":{
            "resource":       this.tubes[rowNum],
            "expected_type":  "tube",
            "display_remove": false,
            "display_barcode":false
          },
          "labware2":{
            "expected_type":  "spin_columns",
            "display_remove": false,
            "display_barcode":false
          },
          "labware3":{
            "expected_type":  "waste_tube",
            "display_remove": false,
            "display_barcode":false
          }
        };
      }
      else {
        rowModel = {
          "rowNum":  rowNum,
          "labware1":{
            "expected_type":  "tube",
            "display_remove": true,
            "display_barcode":true
          },
          "labware2":{
            "expected_type":  "spin_columns",
            "display_remove": false,
            "display_barcode":true
          },
          "labware3":{
            "expected_type":  "waste_tube",
            "display_remove": false,
            "display_barcode":false
          }
        };
      }

      return rowModel;
    },

    createSpinColumns:function () {
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

    makeTransfer:function (source, destination_SC_BR, index) {
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
    }
  });

  return KitModel;

})
