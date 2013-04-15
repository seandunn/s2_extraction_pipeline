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

      this.initialiseCaching();
      this.initialiseConnections(initData);
      return this;
    },

    makeAllTransfers: function(tube) {
      var destinations = _.chain(arguments).drop(1);
      this.makeTransfers({
        preflight: function(that) {
          return tube.order();
        },
        process: function(that, order) {
          return destinations.map(function(destination) {
            return {
              source:      tube,
              destination: destination,
              order:       order,
              details:     that.config.output[destination.resourceType]
            };
          }).value();
        }
      });
    },

    checkPageComplete:function() {
      return true;
    }
  });

  return Model;

})
