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
  'extraction_pipeline/models/base_page_model'
  , 'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction_2.json'
], function(BasePageModel, dataJSON) {

  var KitModel = Object.create(BasePageModel);

  $.extend(KitModel, {
    //TODO: add suitable methods for the model

    init:function (owner) {
      BasePageModel.init(owner);
      this.labware = undefined;
      this.user = undefined;
      this.batch = undefined;
      this.tubes = [];
      return this;
    },
    setBatch:function (batch) {
      console.log("setBatch : ", batch);
      this.addResource(batch);
      this.batch = batch;
      this.dirtySetTubes(); // as in: from the batch, I get the tubes involved...
      this.owner.childDone(this, "batchAdded");
    },
    makeTransfer:function(source,destination){
      var root, that = this;
      this.owner.getS2Root()
        .then(function(r){
          // save sc
          root = r;
          return {}; //...
        })
        .then(function(){
          return root.tube_spin_column_transfers.new({"source":source, "destination":destination});
        })
        .then(function(){
          that.owner.childDone(that,"modelUpdated", {});
        })
        .fail(function(){
          // ...
        });
    },
    dirtySetTubes:function(){
      var that = this;
      this.setTestData(dataJSON);
      this.fetchResourcePromiseFromBarcode("XX111111K")
        .then(function (rsc) {
          that.tubes.push(rsc);
          that.tubes.push(rsc);
          that.tubes.push(rsc);
          that.tubes.push(rsc);
        });
//      this.uuids = this.owner.tubeUUIDs;
    }

  });

  return KitModel;

})
