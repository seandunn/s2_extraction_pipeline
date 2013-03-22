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
  , 'config'
  , 'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction/2.json'
], function (BasePageModel, config, dataJSON) {


  var SelectionPageModel = Object.create(BasePageModel);

  $.extend(SelectionPageModel, {
    init:function (owner) {
      console.log("selection model init");
      BasePageModel.init(owner);
      this.tubes = [];
      this.capacity = 12;
      this.batch = undefined;
      this.user = undefined;
      return this;
    },
    setBatch:function (batch) {
      console.log("setBatch : ", batch);
      this.addResource(batch);
      this.batch = batch;
      this.owner.childDone(this, "batchAdded");
    },
    setSeminalLabware:function (labware) {
      console.log("setSeminalLabware : ", labware);
      this.addResource(labware);
      this.tubes.push(labware);
      if(this.batch){

      }
      this.owner.childDone(this, "seminalLabwareAdded");
    },
    setUser:function (user) {
      console.log("setUser : ", user);
      this.user = user;
      this.owner.childDone(this, "userAdded");
    },
    addTube:function (newTube) {
      if (this.tubes.length > this.capacity - 1) {
        throw {"type":"SelectionPageException", "message":"Only " + this.capacity + " orders can be selected" };
      }

      this.tubes.push(newTube);
      this.owner.childDone(this, "modelUpdated", {index:this.tubes.length, updateType:"addition"});
      return this;
    },
    addTubeFromBarcode:function (barcode) {
      var that = this;
      this.setTestData(dataJSON);
      this.fetchResourcePromiseFromBarcode(barcode)
          .then(function (rsc) {
            that.addTube(rsc);
          })
          .fail(function () {
            //todo: handle error
          });
    },
    getCapacity:function () {
      return this.capacity;
    },
    removeTubeByUuid:function (uuid) {
      for (var i = 0; i < this.tubes.length; i++) {
        if (this.tubes[i].uuid === uuid) {
          this.tubes.splice(i, 1);
          this.owner.childDone(this, "modelUpdated", {index:i, updateType:"substraction"});
          return;
        }
      }
    },
    getNumberOfTubes:function () {
      return this.tubes.length;
    },
    makeBatch:function(){
      //TODO: for now, let's pretend there is no batch... we create one.
      var that = this;
      this.owner.getS2Root()
          .then(function(root){
            return root.batches.new({items:that.tubes});
          }).then(function(batch){
            debugger;
            return batch.save();
          }).then(function(savedBatch){
            debugger;
            that.owner.childDone(that,"batchSaved");
          }).fail( function(){
          debugger;
          }
      );
    }
  });
  return SelectionPageModel;
});
