define([
  "models/base_page_model",
  "mapper/operations"
], function (BasePageModel, Operations) {
  "use strict";

  var SelectionPageModel = Object.create(BasePageModel);

  $.extend(SelectionPageModel, {
    init:function (owner, workflowConfig) {
      this.owner = owner;
      this.inputs = $.Deferred();
      this.capacity = workflowConfig.capacity || 12;
      this.config = workflowConfig;
      this.validators = [batchHasCapacity, labwareUniqueInBatch, labwareRoleIsEqual];

      // Only add contentsAreEqual for tubes or spin columns
      if (this.config.output[0].aliquotType) {
        this.validators.unshift(contentsAreEqual);
      }

      this.initialiseCaching();
      return $.Deferred().resolve(this).promise();
    },

    setup: function(setupData){
      this.user = setupData.user;
      var deferred = $.Deferred();
      var thisModel = this;
      if (setupData.batch) {
        this.batch = setupData.batch;
        this.cache.push(setupData.batch);
        setupInputs(this)
            .then(function () {
              deferred.resolve(thisModel);
            }).fail(function () {
              deferred.reject({message: "Couldn't retrieve the labware!"});
            });
      } else if (setupData.labware) {
        this.cache.push(setupData.labware);
        this.inputs = $.Deferred().resolve([setupData.labware]).promise();
        deferred.resolve(thisModel);
      } else {
        throw "This model should not be created without either a batch or scanned labware";
      }

      return deferred.promise();
    },

    addTube: function (newInput) {
      var deferred = $.Deferred();
      var thisModel = this;
      
      var context = {
        model: thisModel,
        input: newInput,
        deferred: deferred
      };

      _.reduce(this.validators, function(memo, validator) {
        return memo.then(_.partial(validator, context));
      }, thisModel.inputs.fail(function () {
        return deferred.reject({message: "Couldn't send the search for the order", previous_error: null});
      })).then(function (result) {
            
        // it is only now that we can add the tube....
        result.push(newInput);
        thisModel.inputs = $.Deferred().resolve(result).promise();
        return deferred.resolve(thisModel);
      })

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
      var thisModel = this;
      return this.inputs
          .then(function (currentInputs) {
            var newInputs = _.filter(currentInputs, function (labware) {
              return labware.uuid !== uuid;
            });
            return thisModel.inputs = $.Deferred().resolve(newInputs).promise();
          });
    },

    changeRoleWithoutChangingBatch: function(){
      var thisModel = this;
      var itemsByOrderUUID = {};
      var inputs;
      var addingRoles = {updates:[]};
      var changingRoles = {updates:[]};
      var deferred = $.Deferred();

      thisModel.inputs
        .then(function (results) {
          inputs = results;
        })
        .then(function () {
          return $.when.apply(null, _.map(inputs, function (input) {
            return input.order()
              .fail(function () {
                deferred.reject({
                  message: "Couldn't load one of the orders! Contact the administrator of the system."
                });
              })
              .then(function (order) {
                itemsByOrderUUID[order.uuid] = itemsByOrderUUID[order.uuid] || { order:order, items: []};
                var labware = _.find(order.items[thisModel.config.input.role], function(labware) { return labware.status === "done" && labware.uuid === input.uuid; } );
                itemsByOrderUUID[order.uuid].items.push(labware);
              });
          }));
        })
        .fail(function(){
          deferred.reject({
            message:"Couldn't load the orders. Contact the administrator of the system."
          });
        })
        .then(function(){
          _.each(itemsByOrderUUID, function (orderKey) {
            _.each(orderKey.items, function (item) {
              addingRoles.updates.push({
                input:  {
                  order: orderKey.order
                },
                output: {
                  resource: item,
                  role:     thisModel.config.output[0].role
                }});
              changingRoles.updates.push({
                input:  {
                  order:    orderKey.order,
                  resource: item,
                  role:     thisModel.config.input.role
                },
                output: {
                  resource: item,
                  role:     thisModel.config.output[0].role
                }});
            });
          });
          return Operations.stateManagement().start(addingRoles);
        })
        .then(function(){
          return Operations.stateManagement().complete(changingRoles);
        })
        .then(function(){
          deferred.resolve(thisModel);
        })
        .fail(function(){
          deferred.reject({message: "Couldn't update the role!"});
        });
      return deferred.promise();
    },

    makeBatch: function () {
      var thisModel = this;
      var deferred = $.Deferred();
      var batchBySideEffect;
      var addingRoles = {updates:[]};
      var changingRoles = {updates:[]};
      var root;
      
      this.owner.getS2Root()
          .then(function (result) {
            root = result;
            return thisModel.inputs;
          })
          .then(function (inputs) {
            return root.batches.new({resources: inputs}).save();
          })
          .then(function (savedBatch) {
            batchBySideEffect = savedBatch;
            return savedBatch.getItemsGroupedByOrders();
          })
          .then(function (itemsByOrders) {
            _.each(itemsByOrders, function (orderKey) {
              _.each(orderKey.items, function (item) {
                addingRoles.updates.push({
                  input:  {
                    order: orderKey.order
                  },
                  output: {
                    resource: item,
                    role:     thisModel.config.output[0].role,
                    batch:    batchBySideEffect.uuid
                  }});
                changingRoles.updates.push({
                  input:  {
                    order:    orderKey.order,
                    resource: item,
                    role:     thisModel.config.input.role
                  },
                  output: {
                    resource: item,
                    role:     thisModel.config.output[0].role
                  }});
              });
            });
            return Operations.stateManagement().start(addingRoles);
          }).then(function () {
            return Operations.stateManagement().complete(changingRoles);
          }).then(function () {
            thisModel.batch = batchBySideEffect; // updating the batch in the model, once all the requests succeeded.
            deferred.resolve(thisModel);
          }).fail(function () {
            deferred.reject({message: "Couldn't make a batch!"});
          });
      return deferred.promise();
    }
  });

  function setupInputs(that) {
    var inputs = [];
    return that.batch.items
        .then(function (items) {
      return $.when.apply(null,
          _.chain(items)
              .filter(function (item) {
                return item.role === that.config.input.role && item.status === "done";
              })
              .map(function (item) {
                return that.cache.fetchResourcePromiseFromUUID(item.uuid)
                    .then(function (resource) {
                      inputs.push(resource);
                    });
              })
              .value());
        })
        .then(function () {
          return that.inputs.resolve(inputs);
        })
        .fail(that.inputs.reject);
  }

  return SelectionPageModel;

  function batchHasCapacity(context, result) {
    if (result.length > context.model.capacity - 1) {
      // check if not full
      return context.deferred.reject({message: "Only " + context.model.capacity + " orders can be selected", previous_error: null});
    } else {
      return result;
    }
  }

  function contentsAreEqual (context, result) {
    if (context.model.config.output[0].aliquotType !== context.input.aliquots[0].type) {
      // check if correct type
      var msg = "You can only add \""
          + context.model.config.output[0].aliquotType
          + "\" inputs into this batch. The scanned barcode corresponds to a \""
          + context.input.aliquots[0].type
          + "\" input.";
      return context.deferred.reject({message: msg, previous_error: null});
    } else {
      return result;
    }
  }

  function labwareUniqueInBatch(context, result) {
    if (_.some(result, function (input) { return input.uuid === context.input.uuid; })) {
      // check if not already there
      return context.deferred.reject({message: "You cannot add the same tube twice.", previous_error: null});
    } else {
      return result;
    }
  }

  function labwareRoleIsEqual(context, result) {
    // check if correct role
    return context.input.order().then(function(order) {
      var newTubeHasCorrectRole = _.chain(order.items.filter(function (item) {
        return (item.uuid === context.input.uuid) && 
          (context.model.config.input.role === item.role) && 
          ( "done" === item.status);
      })).some().value();
      if (!newTubeHasCorrectRole) {
        return context.deferred.reject({message: "This tube cannot be added to the current batch, because it does not have the correct role."});
      } else {
        return result;
      }                
    })
  }
});
