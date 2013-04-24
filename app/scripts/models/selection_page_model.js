define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
], function (BasePageModel, Operations) {
  'use strict';

  var SelectionPageModel = Object.create(BasePageModel);

  $.extend(SelectionPageModel, {
    init:function (owner, initData) {
      this.owner = Object.create(owner);
      this.stash_by_BC = {};
      this.stash_by_UUID = {};
      this.tubes = [];
      this.capacity = initData["capacity"] || 12;
      this.config = initData;

      return this;
    },
    setBatch:function (batch) {
      this.addResource(batch);
      this.batch = batch;
      this.owner.childDone(this, "batchAdded");
    },
    setSeminalLabware:function (labware) {
      this.addResource(labware);
      this.tubes.push(labware);
      this.owner.childDone(this, "seminalLabwareAdded");
    },
    setUser:function (user) {
      this.user = user;
      this.owner.childDone(this, "userAdded");
    },
    addTube:function (newTube) {
      if (this.tubes.length > this.capacity - 1) {
        throw {"type":"SelectionPageException", "message":"Only " + this.capacity + " orders can be selected" };
      }
      var listOfIdenticalTubes = _.filter(this.tubes, function (tube) {
        return tube.uuid === newTube.uuid
      });
      if (listOfIdenticalTubes.length > 0) {
        throw {"type":"SelectionPageException", "message":"Can add a tube only once." };
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
    getCapacity:function () {
      return this.capacity;
    },
    removeTubeByUuid:function (uuid) {
      this.tubes = _.filter(this.tubes, function (tube) {
        return tube.uuid !== uuid;
      });

      this.owner.childDone(this, "modelUpdated", {});
    },
    getNumberOfTubes:function () {
      return this.tubes.length;
    },
    makeBatch:function () {
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
                input:{
                  order:orderKey.order
                },
                output:{
                  resource:item,
                  role:that.config.output[0].role,
                  batch:batchBySideEffect.uuid
                }});

              changingRoles.updates.push({
                input:{
                  order:orderKey.order,
                  resource:item,
                  role:that.config.input.role
                },
                output:{
                  resource:item,
                  role:that.config.output[0].role
                }});
            });
          });
          return Operations.stateManagement().start(addingRoles);
        })
        .then(function () {
          return Operations.stateManagement().complete(changingRoles);
        })
        .then(function () {
          that.batch = batchBySideEffect; // updating the batch in the model, once all the requests succeeded.
          that.owner.childDone(that, "batchSaved", that.batch);
        }).fail(function () {
          throw "Could not make a batch";
        }
      );
    }
  });
  return SelectionPageModel;
});
