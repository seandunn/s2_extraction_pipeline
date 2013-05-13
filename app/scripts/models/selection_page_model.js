define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
], function (BasePageModel, Operations) {
  'use strict';

  var SelectionPageModel = Object.create(BasePageModel);

  $.extend(SelectionPageModel, {
    init:function (owner, workflowConfig) {
      this.owner = owner;
      this.tubes = [];
      this.capacity = workflowConfig.capacity || 12;
      this.config = workflowConfig;

      // This horrible thing is a refactoring in progress...
      this.batchSlots = [];
      for (var i = 1; i <= this.capacity; i++) { this.batchSlots.push(i); };

      this.initialiseCaching();
      return this;
    },

    setup: function(setupData){
      this.user = setupData.user;

      if (setupData.batch) {
        this.batch = batch;
        this.cache.push(batch);
        setupInputs(this);
      } else if (setupData.labware) {
        this.cache.push(setupData.labware);
        this.tubes.push(setupData.labware);
      } else throw "This model should not be show without either batch or scanned labware";
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
      return this;
    },

    addTubeFromBarcode:function (barcode) {
      var that = this;
      return this.cache.fetchResourcePromiseFromBarcode(barcode)
      .then(function (rsc) {
        that.addTube(rsc);
      });
    },

    removeTubeByUuid:function (uuid) {
      this.tubes = _.filter(this.tubes, function (tube) {
        return tube.uuid !== uuid;
      });
    },

    makeBatch:function () {
      var that = this;
      var batchBySideEffect;
      var addingRoles = {updates:[]};
      var changingRoles = {updates:[]};

      return this.owner.getS2Root().then(function (root) {
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

        return Operations.stateManagement().start(addingRoles);
      }).then(function() {
        return Operations.stateManagement().complete(changingRoles);
      }).then(function() {
        return that.batch = batchBySideEffect; // updating the batch in the model, once all the requests succeeded.
      }).fail(function () {
        throw "Could not make a batch";
      });
    }
  });

  function setupInputs(that) {
    return that.batch.items.then(function(items) {
      return $.when.apply(null, _.chain(items).filter(function(item) {
        return item.role === that.config.input.role && item.status === 'done';
      }).map(function(item) {
        return that.cache.fetchResourcePromiseFromUUID(item.uuid).then(function(resource) {
          that.addTube(resource);
        });
      }).value());
    });
  }

  return SelectionPageModel;
});
