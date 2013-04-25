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
    init:              function (owner, initData) {
      this.owner = Object.create(owner);
      this.tubes = [];
      this.capacity = initData["capacity"] || 12 ;

      this.config = initData;

      this.initialiseCaching();
      return this;
    },
    setBatch:          function (batch) {
      if (batch) { this.cache.push(batch); }
      this.batch = batch;
      setupInputs(this)
          .then(function () {
            this.owner.childDone(this, "batchAdded");
          })
          .fail(function () {
            this.owner.childDone(this, "error");
          });
    },
    setSeminalLabware: function (labware) {
      this.cache.push(labware);
      this.tubes.push(labware);
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
      var listOfIdenticalTubes = _.filter(this.tubes, function(tube){return tube.uuid === newTube.uuid});
      if (listOfIdenticalTubes.length > 0){
        throw {"type":"SelectionPageException", "message":"Can add a tube only once." };
      }
      this.tubes.push(newTube);
      this.owner.childDone(this, "modelUpdated", {index:this.tubes.length, updateType:"addition"});
      return this;
    },
    addTubeFromBarcode:function (barcode) {
      var that = this;
      this.cache.fetchResourcePromiseFromBarcode(barcode)
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
      var that = this;
      var batchBySideEffect;
      var addingRoles = {updates:[]};
      var changingRoles = {updates:[]};

      this.owner.getS2Root()
          .then(function (root) {
            return root.batches.new({resources:that.tubes}).save();
          }).then(function (savedBatch) {
            batchBySideEffect = savedBatch;
            return savedBatch.getItemsGroupedByOrders();
          }).then(function (itemsByOrders) {
            _.each(itemsByOrders, function (orderKey) {
              _.each(orderKey.items, function (item) {
                addingRoles.updates.push({
                  input: {
                    order:orderKey.order
                  },
                  output:{
                    resource:item,
                    role:    that.config.output[0].role,
                    batch:   batchBySideEffect.uuid
                  }});

                changingRoles.updates.push({
                  input: {
                    order:   orderKey.order,
                    resource:item,
                    role:    that.config.input.role
                  },
                  output:{
                    resource:item,
                    role:    that.config.output[0].role
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
            throw "Could not make a batch";
          }
      );
    }
  });

  function setupInputs(that) {
    return that.batch.items.then(function(items) {
      return $.when.apply(null, _.chain(items).filter(function(item) {
        return item.role === that.config.input.role && item.status === 'done';
      }).map(function(item) {
            return that.cache.fetchResourcePromiseFromUUID(item.uuid).then(function(resource) {
              that.addTube.(resource);
            });
          }).value());
    });
  }

  return SelectionPageModel;
});
