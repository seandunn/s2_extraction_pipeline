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

define([
  'extraction_pipeline/models/base_page_model'
//  , 'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction/2.json'
], function (BasePageModel) {


  var DefaultPageModel = Object.create(BasePageModel);


  $.extend(DefaultPageModel, {
    init:function (owner) {
//      BasePageModel.init(owner);
      this.owner = Object.create(owner);
      this.stash_by_BC = {};
      this.stash_by_UUID = {};



      this.labware = undefined;
      this.user = undefined;
      this.batch = undefined;
      return this;
    },
    setLabware:function (rsc) {
      this.labware = rsc;
      this.owner.childDone(this, "modelUpdated", rsc);
      this.checkIfModelIsValid();
    },
    setUser:function (rsc) {
      this.user = rsc;
      this.owner.childDone(this, "modelUpdated", rsc);
      this.checkIfModelIsValid();
    },
    setLabwareFromBarcode:function (barcode) {
      var that = this;
//      this.setTestData(dataJSON);
      this.fetchResourcePromiseFromBarcode(barcode)
          .then(function (rsc) {
            that.setLabware(rsc);
          })
          .fail(function(){
            //todo: handle error
          });
    },
    setUserFromBarcode:function (barcode) {
      this.setUser(barcode);
    },
    checkIfModelIsValid:function () {
      if (this.user && this.labware) {
        // get the batch...
        var that = this;
        var dataForOwner;
        this.labware.order()
            .then(function (order) {
              return order.batchFor(function () {
                return true;
              });
            })
            .then(function (batch) {
              this.batch = batch;
              that.owner.childDone(that, "modelValidated");
            })
            .fail(function () {
              // we still inform the owner that this is a valid model, even if we don't have batch
              that.owner.childDone(that, "modelValidated");
            });
      }
    }
  });

  return DefaultPageModel;
});
