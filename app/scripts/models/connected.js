define([
  'mapper/operations',
  'extraction_pipeline/behaviours'
], function(Operations, Behaviour) {

  'use strict';

  return {
    init: function(owner, config) {
      this.owner = owner;
      this.user = undefined;
      this.batch = undefined;
      this.previous = false;

      this.initialiseCaching();
      this.initialiseConnections(config);
      return this;
    },

    initialiseConnections: function(config) {
      this.config  = config;          // Configuration of our connections
      this.inputs  = $.Deferred();    // Inputs are always a deferred lookup
      this.outputs = [];              // Outputs are always an array
      this.batch   = undefined;       // There is no batch, yet
      this.user    = undefined;       // There is no user, yet
      this.started = false;           // Has the process started

      // Configure the behaviours based on the configuration
      this.behaviours = _.chain(this.config.behaviours).map(function(behaviourName, name) {
        return [name, Behaviour(behaviourName)];
      }).object().value();
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

    getInputByBarcode: function(requester, barcode) {
      this.inputs.then(_.partial(findByBarcode, barcode)).then(_.partial(handleRetrieveResult, requester));
    },
    getOutputByBarcode: function(requester, barcode) {
      handleRetrieveResult(requester, findByBarcode(barcode, this.outputs));
    },

    getRowModel:function (rowNum, input) {
      var that = this;
      return _.chain(this.config.output).pairs().sort().reduce(function(rowModel, nameToDetails, index) {
        var details = nameToDetails[1];
        var name    = 'labware' + (index+2);  // index=0, labware1=input, therefore labware2 first output
        rowModel[name] = {
          input:           false,
          expected_type:   details.model.singularize(),
          display_remove:  true,
          display_barcode: true
        }
        return rowModel;
      }, {
        rowNum: rowNum,
        enabled: !!this.outputs.length,

        labware1: {
          input:           true,
          resource:        input,
          expected_type:   that.config.input.model.singularize(),
          display_remove:  true,
          display_barcode: true
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
          var promises = _.chain(inputs).map(function(input) {
            return _.chain(that.config.output).pairs().map(function(outputNameAndDetails) {
              var details = outputNameAndDetails[1];
              return Operations.registerLabware(
                root[details.model],
                details.aliquotType,
                details.purpose
              ).then(function(state) {
                that.stash(state.labware, state.barcode);
                that.outputs.push(state.labware);
                return state.labware;
              }).fail(function() {
                that.owner.childDone(that, "failed", {});
              });
            }).value();
          }).flatten().value();

          $.when.apply(null, promises).then(function() {
            that.printBarcodes(that.outputs);
            that.owner.childDone(that, 'labelPrinted', {});
          }).fail(function() {
            that.owner.childDone(that, 'failed', {});
          });
        });
      });
    },

    operate: function(happeningAt, presenters) {
      var that = this;
      var s2root, events = [];

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
        var helper    = function(event) {
          return [
            function() { events.push(event); },           // record an event on a positive behaviour
            function() { operation[event] = doNothing; }  // remove the operation on a negative behaviour
          ];
        };

        _.each(['start','operate','complete'], function(event) {
          that.behaviours[event][happeningAt].apply(null, helper(event));
        });
        return operation;
      }).then(function(operation) {
        // STEP 6: Finally perform the operation and report the events that should happen
        operation.operation().then(function () {
          _.each(events, function(event) {
            that.owner.childDone(that,event+"Operation",{});
          });
        });
      });
    }
  };

  // Convenience method for dealing with finding by barcodes
  function findByBarcode(barcode, array) {
    return _.chain(array).find(function (resource) {
      return resource.labels.barcode.value === barcode.BC;
    }).value();
  }

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

  // TODO: 'requester' should really have 'found' and 'notFound' callbacks
  function handleRetrieveResult(requester, result) {
    if (!result) {
      requester.displayErrorMessage("Barcode not found");
    } else {
      requester.updateModel(result);
    }
  }
});
