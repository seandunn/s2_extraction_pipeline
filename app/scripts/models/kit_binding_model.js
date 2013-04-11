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

    init:function (owner, initData) {
      this.owner = owner;
      this.user = undefined;
      this.batch = undefined;
      this.kitSaved = false;

      this.initialiseCaching();
      this.initialiseConnections(this.config);
      return this;
    },

    validateKitTubes:function (kitType) {
      return (this.config.kitType == kitType);
    },
    getRowModel:function (rowNum, input) {
      var rowModel = {};

      var labware3ExpectedType = (this.config.kitType === 'DNA/RNA') ? 'tube' : 'waste_tube';
      var labware3DisplayBarcode = this.config.kitType === 'DNA/RNA';

      if (!this.kitSaved) {
        rowModel = {
          "rowNum":rowNum,
          "labware1":{
            "resource":input,
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

    makeAllTransfers: function(source, destination) {
      makeTransfers({
        preflight: function(that) {
          return source.order();
        },
        process: function(that, items) {
          return [{
            source:      source,
            destination: destination,
            order:       order
          }];
        }
      });
    },
    saveKitCreateBarcodes:function(kitBC) {

      if (this.batch) {
        this.batch.update({"kit" : kitBC});
        this.kitSaved = true;
      }

      this.createOutputs();
    }
  });

  return Model;

});
