define([
  'extraction_pipeline/models/base_page_model',
  'mapper/operations',
  'extraction_pipeline/connected/behaviours',
  'extraction_pipeline/connected/missing_handlers',
  'extraction_pipeline/connected/caching'
], function(Base, Operations, Behaviour, Missing, Cache) {
  'use strict';

  var Model = Object.create(Base);

  _.extend(Model, {
    init: function(owner, config) {
      var instance = this;

      this.owner = owner;
      this.user = undefined;
      this.batch = undefined;
      this.previous = false;
      this.ready    = false;

      this.config  = config;                                    // Configuration of our connections
      this.batch   = undefined;                                 // There is no batch, yet
      this.user    = undefined;                                 // There is no user, yet
      this.started = false;                                     // Has the process started

      // Configure the behaviours based on the configuration
      this.behaviours = _.chain(this.config.behaviours).map(function(behaviourName, name) {
        return [name, Behaviour(behaviourName)];
      }).object().value();

      // Configure the behaviour of inputs & outputs from configuration
      _.extend(this, _.chain(['inputs','outputs']).map(function(cacheName) {
        var name = (config.cache || {})[cacheName] || 'singular';
        var missingHandler = _.bind(Missing(name), instance);
        var cache = _.extend(Cache.init(), {
          getByBarcode: function(requester, modelName, barcode) {
            return this.get(
              function(r)   { return r.labels.barcode.value === barcode;       }, // Find by barcode
              function(p,f) { return missingHandler(modelName, barcode, p, f); }  // Use the missing handler!
            ).done(_.bind(requester.updateModel, requester)).fail(_.bind(requester.displayErrorMessage, requester));
          }
        });

        return [cacheName, cache];
      }).object().value());

      this.initialiseCaching();
      return this;
    },

    setBatch: function(batch) {
      this.cache.push(batch);
      this.batch = batch;
      setupInputs(this);
      this.owner.childDone(this, "batchAdded");
    },

    setUser: function(userUUID) {
      this.user = userUUID;
      this.owner.childDone(this, "userAdded");
    },

    setupInputPresenters: function(reset) {
      var that = this;
      this.inputs.then(function(inputs) {
        that.owner.rowPresenters = _.chain(inputs).map(function(input, index) {
          var input        = reset ? undefined : input;
          var rowPresenter = that.owner.presenterFactory.create('row_presenter', that.owner);
          rowPresenter.setupPresenter(that.getRowModel(index, input), selectorFunction(that.owner, index));
          return rowPresenter;
        }).value();
      });

      function selectorFunction(presenter, row) {
        return function() {
          return presenter.jquerySelection().find('.row' + row);
        };
      }
    },

    getRowModel:function (rowNum, input) {
      var that = this, previous = this.previous && this.ready;
      return _.chain(this.config.output).pairs().sort().reduce(function(rowModel, nameToDetails, index) {
        var details = nameToDetails[1];
        var name    = 'labware' + (index+2);  // index=0, labware1=input, therefore labware2 first output
        rowModel[name] = {
          input:           false,
          expected_type:   details.model.singularize(),
          display_remove:  previous,
          display_barcode: previous
        }
        return rowModel;
      }, {
        rowNum: rowNum,
        enabled: previous,

        labware1: {
          input:           true,
          resource:        input,
          expected_type:   that.config.input.model.singularize(),
          display_remove:  previous,
          display_barcode: previous
        }
      }).value();
    },

    createOutputs: function() {
      var that = this;
      this.behaviours.outputs.print(function() {
        var root;

        this.owner.getS2Root().then(function(result) {
          root = result;
        }).then(function() {
          that.inputs.then(function(inputs) {
            var labware = [];
            var promises = _.chain(inputs).map(function(input) {
              return _.chain(that.config.output).pairs().filter(function(outputNameAndDetails) {
                var details = outputNameAndDetails[1];
                return details.tracked === undefined ? true : details.tracked;
              }).map(function(outputNameAndDetails) {
                var details = outputNameAndDetails[1];
                return Operations.registerLabware(
                  root[details.model],
                  details.aliquotType,
                  details.purpose
                ).then(function(state) {
                  that.cache.push(state.labware);
                  labware.push(state.labware);
                  return state.labware;
                }).fail(function() {
                  that.owner.childDone(that, "failed", {});
                });
              }).value();
            }).flatten().value();

            $.when.apply(null, promises).then(function() {
              that.outputs.resolve(labware).then(function(outputs) {
                that.printBarcodes(outputs);
              });
              that.owner.childDone(that, 'outputsReady', {});
            }).fail(function() {
              that.owner.childDone(that, 'failed', {});
            });
          });
        });
      }, function() {
        that.outputs.resolve([]);
        that.owner.childDone(that, 'outputsReady', {});
      });
    },

    operate: function(happeningAt, presenters) {
      var that = this;
      var s2root;

      this.owner.getS2Root().then(function (result) {
        // STEP 1: We're going to need the root later!
        s2root = result;
        return result;
      }).then(function() {
        // STEP 2: Retrieve the items for the batch we're working with
        return that.batch.items;
      }).then(function(items) {
        // STEP 3: Map the presenters to the appropriate transfers that are required
        var sourceToOrder = _.chain(items).reduce(function(memo, item) {
          memo[item.uuid] = item.order;
          return memo;
        }, {}).value();

        return _.chain(presenters).reduce(function(memo, presenter) {
          presenter.handleResources(function(source) {
            memo.push(_.chain(arguments).drop(1).map(function(destination, index) {
              return {
                input:        { resource: source,      role: that.config.input.role,         order: sourceToOrder[source.uuid] },
                output:       { resource: destination, role: that.config.output[index].role, batch: that.batch.uuid },
                fraction:     1.0,
                aliquot_type: that.config.output[index].aliquotType
              };
            }).value());
          });
          return memo;
        }, []).flatten().value();
      }).then(function(transferDetails) {
        // STEP 4: Setup the operation
        return Operations.betweenLabware(
          s2root.actions.transfer_tubes_to_tubes,
          _.map(transferDetails, function(details) {
            return function(operations, state) {
              operations.push(details);
              return $.Deferred().resolve();
            };
          })
        )
      }).then(function(operation) {
        // STEP 5: Override the behaviour of the operation so that we do the correct things
        var doNothing = function() { };
        _.each(['start','operate','complete'], function(event) {
          that.behaviours[event][happeningAt](function() {
            var handler = operation[event];
            operation[event] = function() {
              return handler.apply(this, arguments).then(function() {
                that.owner.childDone(that,event+'Operation',{});
              });
            };
          }, function() {
            operation[event] = doNothing;
          });
        });
        return operation;
      }).then(function(operation) {
        // STEP 6: Finally perform the operation and report the final completion
        operation.operation().then(function () {
          that.owner.childDone(that, 'successfulOperation', {});
        }).fail(function() {
          that.owner.childDone(that, 'failedOperation', {});
        });
      });
    },
  });

  return Model;

  // Configures the inputs
  function setupInputs(that) {
    that.batch.items.then(function(items) {
      var inputs = [];
      $.when.apply(null, _.chain(items).filter(function(item) {
        return item.role === that.config.input.role && item.status === 'done';
      }).map(function(item) {
        return that.cache.fetchResourcePromiseFromUUID(item.uuid).then(function(resource) {
          inputs.push(resource);
        });
      }).value()).then(function() {
        that.inputs.resolve(inputs);
      });
    });
  }
});
