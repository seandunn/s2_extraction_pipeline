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

  function findByBarcode(barcode, array) {
    return _.chain(array).find(function (resource) {
      return resource.labels.barcode.value === barcode.BC;
    }).value();
  }

  var ElutionModel = Object.create(BasePageModel);

  $.extend(ElutionModel, {
    //TODO: add suitable methods for the model

    init:function (owner, initData) {
      this.owner = Object.create(owner);
      this.stash_by_BC = {};
      this.stash_by_UUID = {};
      this.labware = undefined;
      this.user = undefined;
      this.batch = undefined;
      this.spinColumns = $.Deferred();

      this.inputRole = initData["input"];
      this.outputRoleForTube = initData["output"]["tube"];

      return this;
    },
    setBatch:function (batch) {
      console.log("setBatch : ", batch);
      this.addResource(batch);
      this.batch = batch;

      this.setAllSpinColumnsFromCurrentBatch();

//      var data = [];
//      var that = this;
//      _.each(this.spin_columns, function (sc, scIndex) {
//        data.push(getRowModel(scIndex));
//      });

      this.owner.childDone(this, "batchAdded");
    },
    setAllSpinColumnsFromCurrentBatch:function () {
      var that = this;
      this.batch.items.then(function (items) {
        var spinColumns = []
        $.when.apply(null, _.chain(items).filter(function (item) {
          return item.role === that.inputRole && item.status === "done";
        }).map(function (item) {
              return that.fetchResourcePromiseFromUUID(item.uuid).then(function (rsc) {
                that.addResource(rsc);
                spinColumns.push(rsc);
              });
            }).value()).then(function () {
              that.spinColumns.resolve(spinColumns);
            });
      });
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

    findTubeInModelFromBarcode:function (barcode) {
      return findByBarcode(barcode, this.spinColumns);
    },
    findSCInModelFromBarcode:function (barcode) {
      return this.spinColumns.then(_.partial(findByBarcode, barcode));
    },

    validateSCBarcode:function (data) {
      return true;
    },

    getRowModel:function (rowNum) {
      return {
        "rowNum":rowNum,
        "remove_arrow":false,
        "labware1":{
          "expected_type":"spin_column",
          "display_remove":true,
          "display_barcode":true
        },
        "labware2":{
          "expected_type":"tube",
          "display_remove":true,
          "display_barcode":true
        }
      };
    },

    createOutputTubes:function () {
      var that = this;
      var root;
      var tubePromises;

      this.owner.getS2Root().
          then(function (result) {
            root = result;
          }).then(function () {
            that.spinColumns.then(function (spinColumns) {
              tubePromises = _.chain(spinColumns).map(function (spinColumn) {
                return Operations.registerLabware(
                    root.tubes,
                    'DNA',
                    'stock'
                ).then(function (state) {
                      that.stash_by_BC[state.barcode] = state.labware;
                      that.stash_by_UUID [state.labware.uuid] = state.labware;
                      that.tubes.push(state.labware);
                      return state.labware;
                    }).fail(function () {
                      that.owner.childDone(that, "failed", {});
                    });
              }).value();

              $.when.apply(null, tubePromises).then(function () {
                that.owner.childDone(that, "success", {});
              }).fail(function () {
                    that.owner.childDone(that, "failed", {});
                  });
            });
          });
    },

    startElution:function () {
      var that = this;
      var addingRoles = {updates:[]};

      this.batch.getItemsGroupedByOrders()
          .then(function (rscByOrders) {
            _.each(rscByOrders, function (orderKey) {
              _.each(orderKey.items, function (item) {

                if (item.role === that.inputRole) {
                  addingRoles.updates.push({
                    input:{
                      order:orderKey.order
                    },
                    output:{
                      resource:item,
                      role:that.outputRoleForTube,
                      batch:that.batch.uuid
                    }});
                }
              });
            });
            return Operations.stateManagement().start(addingRoles);
          })
          .then(function () {
            that.owner.childDone(that, "elutionStarted", {});
          }).fail(function () {
            throw "Could not make a batch";
          }
      );
    },

    makeTransfer:function (source, destination, rowPresenter) {
      var s2root, that = this;
      var spinColumn;
      this.owner.getS2Root()
          .then(function (r) {
            s2root = r;
            return source.order();
          })
          .then(function (order) {
            Operations.betweenLabware(s2root.actions.transfer_spin_columns_to_tubes, [
              function (operations, state) {
                operations.push({
                  input:{ resource:source, role:that.inputRole, order:order },
                  output:{ resource:destination, role:that.outputRoleForSC},
                  fraction:1.0,
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

//                  rowPresenter.childDone("...");
                });
          });
    },

    isValid:function () {
      return false;
    }
  });

  return ElutionModel;

});
