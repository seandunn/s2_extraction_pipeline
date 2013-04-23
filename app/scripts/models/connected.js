define([
  'extraction_pipeline/models/base_page_model',
  'mapper/operations',
  'extraction_pipeline/connected/behaviours',
  'extraction_pipeline/connected/missing_handlers'
], function(Base, Operations, Behaviour, Missing) {
  'use strict';

  var DeferredCache = Object.create(null);
  _.extend(DeferredCache, {
    init: function(model, missingHandler) {
      var instance = Object.create(DeferredCache);
      var results  = $.Deferred();
      _.extend(instance, {
        getByBarcode: function(requester, barcode) {
          results.then(function(array) {
            var result = _.find(array, function(r) { return r.labels.barcode.value === barcode; });
            var deferred = $.Deferred();
            deferred[result ? 'resolve' : 'reject'](result);
            return deferred;
          }).then(function(resource) {
            return resource;                                 // Result remains the same on success
          }, function() {
            return missingHandler(model, instance, barcode); // Result may be handled differently
          }).fail(function() {
            requester.displayErrorMessage('Barcode "' + barcode + '" not found');
          }).done(function(result) {
            requester.updateModel(result);
          });
        },

        // Behave like a promise by binding through to the promise!
        then:    _.bind(results.then, results),
        resolve: _.bind(results.resolve, results)
      });
      return instance;
    }
  });

  var Model = Object.create(Base);

  _.extend(Model, {
    init: function(owner, config) {
      var instance = this;

      this.owner = owner;
      this.user = undefined;
      this.batch = undefined;
      this.previous = false;
      this.printed  = false;

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
        return [cacheName, DeferredCache.init(instance, Missing((config.cache || {})[cacheName]))];
      }).object().value());

      this.initialiseCaching();
      return this;
    },

    setBatch: function(batch) {
      this.addResource(batch);
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
      var that = this, previous = this.previous && this.printed;
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
                that.stash(state.labware, state.barcode);
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
            that.owner.childDone(that, 'labelPrinted', {});
          }).fail(function() {
            that.owner.childDone(that, 'failed', {});
          });
        });
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
        return that.fetchResourcePromiseFromUUID(item.uuid).then(function(resource) {
          that.addResource(resource);
          inputs.push(resource);
        });
      }).value()).then(function() {
        that.inputs.resolve(inputs);
      });
    });
  }
});
