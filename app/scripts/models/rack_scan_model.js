define([
  'models/base_page_model'
  , 'mapper/operations'
  , 'lib/file_handling/racking'
  , 'labware/presenter'
], function (BasePageModel, Operations, CSVParser, LabwarePresenter) {
  'use strict';

  var Model = Object.create(BasePageModel);

  _.extend(Model, LabwarePresenter, {
    init: function (owner, config, inputModel) {
      this.owner = owner;
      this.config = config;
      this.expected_type = "tube_rack";
      this.inputs = $.Deferred();
      this.output = [];
      this.initialiseCaching();

      _.extend(this, inputModel);

      return this;
    },

    analyseFileContent: function (data) {
      var locationsSortedByBarcode = CSVParser.from(data);
      var model = this;
      var root;

      return getTubesOnRack(model, locationsSortedByBarcode)
        .fail(function (error) {
          model.owner.childDone(model, "error", error.message);
        })
        .then(function (inputTubes) {
          model.inputs = $.Deferred().resolve(inputTubes).promise();
          return prepareTransferDataPromise(model, locationsSortedByBarcode);
        })
        .then(function () {
          return model.owner.getS2Root();
        })
        .then(function (result) {
          root = result;
          return model.inputs;
        })
        .then(function (inputs) {
          // TODO: This creation is fake! We artificially build a tube_rack like this
          // because it's not a base resource for now...
          var tube_rack = root.tube_racks.new();
          tube_rack.tubes = {};
          _.each(model.preparedTransferData, function (uuid, location) {
            if (uuid) {
              tube_rack.tubes[location] = _.find(inputs, function (input) {
                return input.uuid === uuid
              });
            }
          });

          return {rack: model.presentResource(tube_rack)};
        });
    },

    createOutputs: function(printer) {
      var model = this;
      var root;
      return model.owner.getS2Root().then(function(result) {
        root = result;
        return Operations.registerLabware(
          root[model.config.output[0].model],
          model.config.output[0].aliquotType,
          model.config.output[0].purpose,
          {
            number_of_rows:     8,
            number_of_columns:  12,
            tubes:              model.preparedTransferData
          });
      }).then(function (state) {
        model.cache.push(state.labware);
        model.owner.childDone(model, 'outputsReady', {});
        return state.labware;
      }).then(function(rack){
        model.printBarcodes([rack], printer);
        return rack;
      }).fail(function () {
        $('body').trigger('s2.status.error', "Impossible to create the rack.");
      });
    },

    fire: function(printer) {
      var deferred           = $.Deferred(),
          model              = this,
          ordersSortedByUUID = {},
          rack,
          inputs;

      function makeJSONUpdateFor(role,uuid,event) {
        var updateJson               = { items: {} };
        updateJson.items[role]       = {};
        updateJson.items[role][uuid] = { event: event };
        return updateJson;
      }

      model.createOutputs(printer)
        .then(function (result) {
          rack = result;
          return model.inputs;
        }).fail(function () {
          deferred.reject({
            message: "Couldn't load the input tubes! Contact the administrator of the system."
          });
        }).then(function (result) {
          inputs = result;

          return $.when.apply(null, _.map(inputs, function(input){
            return input.order().fail(function () {
              deferred.reject({
                message: "Couldn't load one of the orders! Contact the administrator of the system."
              });
            }).then(function (order) {
              ordersSortedByUUID[order.uuid] = order; // we save orders
            });
          }));
        }).fail(function() {
          deferred.reject({
            message: "Couldn't load the orders. Contact the administrator of the system."
          });
        }).then(function() {
          return $.when.apply(null, _.map(ordersSortedByUUID, function (order) {
            return order.update(makeJSONUpdateFor(model.config.output[0].role, rack.uuid, "start")).
              fail(function() {
                deferred.reject({
                message: "Couldn't start the role on the output rack. Contact the administrators."
              });
            }).then(function(order) {
              return order.update(makeJSONUpdateFor(model.config.output[0].role, rack.uuid, "complete"))
            }).fail(function () {
              deferred.reject({
                message: "Couldn't complete the role on the output rack! Contact the administrator of the system."
              });
            });
          }));
        }).fail(function() {
          deferred.reject({
            message:"An error occured during the transfer process! Contact the administrator of the system."
          });
        }).then(function () {
          deferred.resolve(model);
        });

      return deferred.promise();
    }
  });

  function getTubesOnRack(model, locationsSortedByBarcode) {
    var inputBarcodes = _.keys(locationsSortedByBarcode);
    var searchDeferred = $.Deferred();
    model.owner.getS2Root()
      .then(function (root) {
          return root.tubes.searchByBarcode().ean13(inputBarcodes).all();
      })
      .fail(function () {
          return searchDeferred.reject({message: "Couldn't search for the tubes in the rack!"});
      })
      .then(function (inputTubes) {
          if (inputTubes.length === 0) {
            return searchDeferred.reject({message: "There are no tubes in this rack!"});
          }
          if (inputTubes.length !== inputBarcodes.length) {
            return searchDeferred.reject({message: "The tubes were not all found!"});
          }
          if (_.some(inputTubes, function (tube) {
            return tube.resourceType !== inputTubes[0].resourceType;
          })) {
            return searchDeferred.reject({message: "The tubes are not all of the same type"});
          }
          return searchDeferred.resolve(inputTubes);
      });
    return searchDeferred.promise();
  }

  function prepareTransferDataPromise(model, locationsSortedByBarcode) {
    model.preparedTransferData = {};

    var resources = [];
    var promises = _.map(locationsSortedByBarcode, function (location, barcode) {
      return model.cache.fetchResourcePromiseFromBarcode(barcode)
      .then(function (rsc) {
        resources.push(rsc);
      });
    });

    return $.when.apply(null, promises)
    .then(function () {
      _.each(resources, function (rsc) {
        var location = locationsSortedByBarcode[rsc.labels.barcode.value];
        model.preparedTransferData[location] = rsc.uuid;
      });
    });
  }

  return Model;
});

