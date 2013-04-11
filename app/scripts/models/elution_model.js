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
  'extraction_pipeline/models/connected'
], function (BasePageModel, Operations, Connected) {
  var Model = Object.create(BasePageModel);

  $.extend(Model, Connected, {
    //TODO: add suitable methods for the model

    init:function (owner, initData) {
      this.owner = owner;
      this.user = undefined;
      this.batch = undefined;

      this.elutionStarted = false;

      this.config = initData;

      this.initialiseCaching();
      this.initialiseConnections(this.config.output[this.config.output.target]);
      return this;
    },

    getRowModel:function (rowNum, input) {
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

    startElution:function () {
      var that = this;
      var addingRoles = {updates:[]};

      this.batch.getItemsGroupedByOrders()
          .then(function (rscByOrders) {
            _.each(rscByOrders, function (orderKey) {
              _.each(orderKey.items, function (item) {
                if (item.role === that.config.output[that.config.output.target].role) {
                  addingRoles.updates.push({
                    input:{
                      order:orderKey.order
                    },
                    output:{
                      resource:item,
                      role:that.config.output[that.config.output.target].role,
                      batch:that.batch.uuid
                    }});
                }
              });
            });
            return Operations.stateManagement().start(addingRoles);
          })
          .then(function () {
            that.elutionStarted = true;
            that.owner.childDone(that, "elutionStarted", {});
          }).fail(function () {
            throw "Could not make a batch";
          }
      );
    },

    makeAllTransfers: function() {
      makeTransfers({
        prelight: function(that) {
          return that.batch.items;
        },
        process: function(that, items) {
          var destBySrc = _.chain(this.owner.rowPresenters).reduce(function (memo, presenter) {
            memo[presenter.labware1Presenter.labwareModel.resource.uuid] = {
              source:presenter.labware1Presenter.labwareModel.resource,
              destination:presenter.labware2Presenter.labwareModel.resource
            };
            return memo
          }, {}).value();

          return _.chain(items).filter(function(item) {
            return item.role === that.config.input.role;
          }).map(function(item) {
            return {
              source:      destBySrc[item.uuid].source;
              destination: destBySrc[item.uuid].destination;
              order:       item.order;
            };
          }).flatten().value();
        }
      });
    },

    hasStarted:function () {
      return this.elutionStarted;
    }
  });

  return Model;

});
