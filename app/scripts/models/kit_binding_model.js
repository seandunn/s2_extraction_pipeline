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
  'mapper/operations',
  'mapper_services/print',
], function (BasePageModel, Operations, PrintService) {
  function findByBarcode(barcode, array) {
    return _.chain(array).find(function(resource) {
      return resource.labels.barcode.value === barcode.BC;
    }).value();
  }

  var KitModel = Object.create(BasePageModel);

  $.extend(KitModel, {

    init:function (owner, initData) {
      this.owner = Object.create(owner);
      this.stash_by_BC = {};
      this.stash_by_UUID = {};
      this.labware = undefined;
      this.user = undefined;
      this.batch = undefined;
      this.tubes = $.Deferred();
      this.spinColumns = [];
      this.availableBarcodes = [];
      this.kitSaved = false;

      this.inputRole = initData["input"];
      this.outputRoleForTube = initData["output"]["tube"];
      this.outputRoleForSC = initData["output"]["spin_column"];
      this.validKitType = initData["kitType"];

      return this;
    },
    setBatch:function (batch) {
      var that = this;
      console.log("setBatch : ", batch);
      this.addResource(batch);
      this.batch = batch;
      this.setAllTubesFromCurrentBatch(); // as in: from the batch, I get the tubes involved...

      this.owner.childDone(this, "batchAdded");
    },
    setAllTubesFromCurrentBatch:function () {
      var that = this;
      this.batch.items.then(function(items) {
        var tubes = []
        $.when.apply(null, _.chain(items).filter(function(item) {
          return item.role === that.inputRole && item.status === "done";
        }).map(function(item) {
          return that.fetchResourcePromiseFromUUID(item.uuid).then(function(rsc) {
            that.addResource(rsc);
            tubes.push(rsc);
          });
        }).value()).then(function() {
          that.tubes.resolve(tubes);
        });
      });
    },

    findTubeInModelFromBarcode:function (barcode) {
      return this.tubes.then(_.partial(findByBarcode, barcode));
    },
    findSCInModelFromBarcode:function (barcode) {
      return findByBarcode(barcode, this.spinColumns);
    },
    validateKitTubes:function (kitType) {
      return (this.validKitType == kitType);
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

      var labware3ExpectedType = (this.validKitType == 'DNA/RNA') ? 'tube' : 'waste_tube';
      var labware3DisplayBarcode = this.validKitType == 'DNA/RNA';

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
            "expected_type":"spin_column",
            "display_remove":false,
            "display_barcode":false
          },
          "labware3":{
            "expected_type":  labware3ExpectedType,
            "display_remove": false,
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
            "expected_type":"spin_column",
            "display_remove":false,
            "display_barcode":true
          },
          "labware3":{
            "expected_type":  labware3ExpectedType,
            "display_remove": false,
            "display_barcode":labware3DisplayBarcode
          }
        };
      }

      return rowModel;
    },

    createMissingSpinColumns:function () {
      var that = this;
      var listOfPromises = [];
      var root = null;

      this.owner.getS2Root().
        then(function (result) {
          root = result;
        }).then(function () {
          that.tubes.then(function(tubes) {
            var spinColumnPromises = _.chain(tubes).map(function(tube) {
              return Operations.registerLabware(
                root.spin_columns,
                'DNA',
                'stock'
              ).then(function (state) {
                that.stash_by_BC[state.barcode] = state.labware;
                that.stash_by_UUID [state.labware.uuid] = state.labware;
                that.spinColumns.push(state.labware);
                return state.labware;
              }).fail(function () {
                that.owner.childDone(that, "failed", {});
              });
            }).value();

            $.when.apply(null, spinColumnPromises).then(function () {
              that.printBarcodes(that.spinColumns);
              that.owner.childDone(that, "success", {});
            }).fail(function () {
              that.owner.childDone(that, "failed", {});
            });
          });
        });
    },

    makeTransfer:function (source, destination, rowPresenter) {
      var that = this;
      var s2root = null;

      this.owner.getS2Root().then(function (result) {
        s2root = result;
        return source.order();
      })
          .then(function (order) {
            Operations.betweenLabware(s2root.actions.transfer_tubes_to_tubes, [
              function (operations, state) {
                operations.push({
                  input:       { resource:source, role:that.inputRole, order:order },
                  output:      { resource:destination, role:that.outputRoleForSC, batch: that.batch.uuid},
                  fraction:    1.0,
                  aliquot_type:source.aliquots[0].type
                });
                return $.Deferred().resolve();
              }
            ]
            ).operation()
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
          });
    },
    saveKitCreateBarcodes:function(kitBC) {

      if (this.batch) {
        this.batch.update({"kit" : kitBC});
        this.kitSaved = true;
      }

      this.createMissingSpinColumns();
    },
    printBarcodes:function(collection) {
      var that = this;
      var printer = PrintService.printers[0];

      // Extract the print label details from each item in the collection
      var printItems = _.map(collection, function(item) {
        return item.returnPrintDetails();
      });

      printer.print(printItems)
             .done(function() {
                    that.owner.childDone(that, 'barcodePrintSuccess', {});
              })
             .fail(function() {
                    that.owner.childDone(that, 'barcodePrintFailure', {});
              });
    }

  });

  return KitModel;

});
