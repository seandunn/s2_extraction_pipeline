define([
  'mapper/operations',
], function(Operations) {
  'use strict';

  return {
    initialiseConnections: function(config) {
      this.config  = config;          // Configuration of our connections
      this.inputs  = $.Deferred();    // Inputs are always a deferred lookup
      this.outputs = [];              // Outputs are always an array
      this.batch   = undefined;       // There is no batch, yet
    },

    setBatch: function(batch) {
      this.addResource(batch);
      this.batch = batch;
      setupInputs(this);
      this.owner.childDone(this, "batchAdded");
    },

    setupInputPresenters: function() {
      var that = this;
      this.inputs.then(function(inputs) {
        that.owner.rowPresenters = _.chain(inputs).reduce(function(memo, input) {
          var rowPresenter = that.owner.presenterFactory.create('row_presenter', that.owner);
          rowPresenter.setupPresenter(that.getRowModel(memo.length, input), selectorFunction(that.owner, memo.length));
          memo.push(rowPresenter);
          return memo;
        }, []).value();
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

    makeTransfers: function(handler) {
      var that = this;
      var s2root;

      this.owner.getS2Root().then(function (result) {
        s2root = result;
        return result;
      }).then(_.partial(handler.preflight, that)).then(_.partial(handler.process, that)).then(function(transferDetails) {
        Operations.betweenLabware(
          s2root.actions.transfer_tubes_to_tubes,
          _.map(transferDetails, function(details) {
            return function(operations, state) {
              operations.push({
                input:       { resource:details.source,      role:that.config.input.role, order:details.order },
                output:      { resource:details.destination, role:details.details.role,   batch:that.batch.uuid},
                fraction:    1.0,
                aliquot_type:details.details.aliquotType
              });
              return $.Deferred().resolve();
            };
          })
        ).operation().then(function () {
          that.owner.childDone(that,"allTransferCompleted",{transfers: transferDetails});
        });
      });
    },
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
