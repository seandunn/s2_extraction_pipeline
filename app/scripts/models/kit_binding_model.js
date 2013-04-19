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
    getRowModel:function (rowNum, input) {
      var that = this, kitSaved = this.previous;
      return _.chain(this.config.output).pairs().sort().reduce(function(rowModel, nameToDetails, index) {
        var details = nameToDetails[1];
        var name    = 'labware' + (index+2);  // index=0, labware1=input, therefore labware2 first output
        rowModel[name] = {
          input:           false,
          expected_type:   details.model.singularize(),
          display_remove:  kitSaved,
          display_barcode: kitSaved
        }
        return rowModel;
      }, {
        rowNum: rowNum,
        enabled: kitSaved,

        // TODO: The labware entries should be generated from the config, not by knowing there are 3!
        labware1: {
          input:           true,
          resource:        input,
          expected_type:   that.config.input.model.singularize(),
          display_remove:  kitSaved,
          display_barcode: kitSaved
        },
        labware3: {
          input:           false,
          expected_type:   'waste_tube',
          display_remove:  false,
          display_barcode: false
        }
      }).value();
    }
  });

  return Model;
});
