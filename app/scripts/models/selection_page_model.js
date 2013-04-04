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
  , 'mapper/operations'
], function (BasePageModel, Operations) {

  var SelectionPageModel = Object.create(BasePageModel);

  $.extend(SelectionPageModel, {
    init:              function (owner) {
      this.owner = Object.create(owner);
      this.stash_by_BC = {};
      this.stash_by_UUID = {};
      this.tubes = [];
      this.capacity = 12;
      this.batch = undefined;
      this.user = undefined;
      return this;
    },
    setBatch:          function (batch) {
      this.addResource(batch);
      this.batch = batch;
      this.owner.childDone(this, "batchAdded");
    },
    setSeminalLabware: function (labware) {
      this.addResource(labware);
      this.tubes.push(labware);
      if (this.batch) {

      }
      this.owner.childDone(this, "seminalLabwareAdded");
    },
    setUser:           function (user) {
      this.user = user;
      this.owner.childDone(this, "userAdded");
    },
    addTube:           function (newTube) {
      if (this.tubes.length > this.capacity - 1) {
        throw {"type":"SelectionPageException", "message":"Only " + this.capacity + " orders can be selected" };
      }

      this.tubes.push(newTube);
      this.owner.childDone(this, "modelUpdated", {index:this.tubes.length, updateType:"addition"});
      return this;
    },
    addTubeFromBarcode:function (barcode) {
      var that = this;
      this.fetchResourcePromiseFromBarcode(barcode)
          .then(function (rsc) {
            that.addTube(rsc);
          })
          .fail(function () {
            that.owner.childDone(that, "barcodeNotFound", {});
          });
    },
    getCapacity:       function () {
      return this.capacity;
    },
    removeTubeByUuid:  function (uuid) {
      for (var i = 0; i < this.tubes.length; i++) {
        if (this.tubes[i].uuid === uuid) {
          this.tubes.splice(i, 1);
          this.owner.childDone(this, "modelUpdated", {index:i, updateType:"substraction"});
          return;
        }
      }
    },
    getNumberOfTubes:  function () {
      return this.tubes.length;
    },
    makeBatch:         function () {
      //TODO: for now, let's pretend there is no batch... we create one.
      var that = this;
      var batchBySideEffect;
      var addingRoles = {updates:[]};
      var changingRoles = {updates:[]};
      var input_role = "tube_to_be_extracted_na+p";
      var ouput_role = "binding_tube_to_be_extracted_na+p";

      this.owner.getS2Root()
          .then(function (root) {
            return root.batches.new({resources:that.tubes}).save();
          }).then(function (savedBatch) {
            batchBySideEffect = savedBatch;
            return savedBatch.getResourcesGroupedByOrders();
          }).then(function (tubesByOrders) {
            _.each(tubesByOrders, function (orderKey) {
              console.log(" ORDER :: ", orderKey);
              _.each(orderKey.items, function (tube) {
                console.log(" TUBE :: ", tube);

                addingRoles.updates.push({
                  input: {
                    order:orderKey.order
                  },
                  output:{
                    resource:tube,
                    role:    ouput_role
                  }});

                changingRoles.updates.push({
                  input: {
                    order:   orderKey.order,
                    resource:tube,
                    role:    input_role
                  },
                  output:{
                    resource:tube,
                    role:    ouput_role
                  }});
              });
            });
            return Operations.stateManagement().start(addingRoles);})
          .then(function () {
              return Operations.stateManagement().complete(changingRoles);})
          .then(function () {
            that.batch = batchBySideEffect; // updating the batch in the model, once all the requests succeeded.
            that.owner.childDone(that, "batchSaved", that.batch);
          }).fail(function () {
            throw "Something wrong happend...";
          }
      );
    }
  });
  return SelectionPageModel;
});
