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

      this.initialiseCaching();
      return this;
    },

    setup: function(setupData){
      this.user = setupData.user;

      if (setupData.batch) {
        this.batch = setupData.batch;
        this.cache.push(setupData.batch);
        return setupInputs(this);
      } else if (setupData.labware) {
        this.cache.push(setupData.labware);
        this.tubes.push(setupData.labware);
        return $.Deferred().resolve().promise();
      } else throw "This model should not be created without either a batch or scanned labware";
    },

    addTube: function (newTube) {
      var deferred = $.Deferred();
      var thisModel = this;

      $.Deferred().resolve()
          .then(function () {
            if (thisModel.tubes.length > thisModel.capacity - 1) {
              deferred.reject({message: "Only " + thisModel.capacity + " orders can be selected", previous_error: null});
            } else if (thisModel.config.output[0].aliquotType !== newTube.aliquots[0].type) {
              var msg = "You can only add '"
                  + thisModel.config.output[0].aliquotType
                  + "' tubes into this batch. The scanned barcode corresponds to a '"
                  + newTube.aliquots[0].type
                  + "' tube.";
              deferred.reject({message: msg, previous_error: null});
            } else if (_.some(thisModel.tubes, function (tube) {
              return tube.uuid === newTube.uuid;
            })) {
              deferred.reject({message: 'You cannot add the same tube twice.', previous_error: null});
            }
          }).then(function () {
            return newTube.order();
          })
          .fail(function () {
            return deferred.reject({message: "Couldn't send the search for the order", previous_error: null});
          })
          .then(function (order) {
            var newTubeHasCorrectRole = _.chain(order.items.filter(function (item) {
              return (item.uuid === newTube.uuid) && (thisModel.config.input.role === item.role) && ( "done" === item.status);
            })).some().value();
            if (!newTubeHasCorrectRole) {
              return deferred.reject({message:"This tube cannot be added to the current batch, because it does not have the correct role."});
            }
            thisModel.tubes.push(newTube);
            return deferred.resolve(thisModel);
          });
      return deferred.promise();
    },

    addTubeFromBarcode: function (barcode) {
      var thisModel = this;
      var deferred = $.Deferred();
      this.cache.fetchResourcePromiseFromBarcode(barcode)
          .fail(function () {
            deferred.reject({message: "Couldn't find the resource related to this barcode", previous_error: null});
          })
          .then(function (rsc) {
            return thisModel.addTube(rsc);
          })
          .fail(function(error){
            deferred.reject(error);
          })
          .then(function(){
            deferred.resolve(thisModel);
          });
      return deferred.promise();
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
