define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
  , 'extraction_pipeline/lib/csv_parser'
], function (BasePageModel, Operations, CSVParser) {
  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init: function (owner, config) {
      this.owner = owner;
      this.config = config;
      this.inputs = $.Deferred();
      this.output = [];
      this.initialiseCaching();
      return this;
    },

    createOutputs: function () {
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
        model.printBarcodes([rack], model.config.defaultPrinter);
        return rack;
      }).fail(function () {
        $('body').trigger('s2.status.error', "Impossible to create the rack.");
      });
    },

    fire: function () {
      var model = this;
      function makeJSONUpdateFor(role,uuid,event) {
        var updateJson = { items: {} };
        updateJson.items[role] = {};
        updateJson.items[role][uuid] = {
          event: event,
          batch_uuid: model.batch.uuid
        };
        return updateJson;
      }
      model.createOutputs()
      .then(function (rack) {
        return model.batch.orders     // promises not chained to make 'rack' part of the scope
        .then(function (orders) { // of the following methods
          return $.when
          .apply(null, _.chain(orders)
                 .map(function (order) {
                   return order.update(makeJSONUpdateFor(model.config.output[0].role, rack.uuid, "start"))
                   .then(function (order) {
                     return order.update(makeJSONUpdateFor(model.config.output[0].role, rack.uuid, "complete"))
                   })
                 })
                );
        });

      })
      .then(model.inputs)
      .then(function(inputs){
        return $.when
        .apply(null, _.chain(inputs)
               .map(function (input) {
                 return input.order.then(function(order){
                   return order.update(makeJSONUpdateFor(model.config.output[1].role, input.uuid, "start"))
                 }).then(function(order){
                   return order.update(makeJSONUpdateFor(model.config.output[1].role, input.uuid, "complete"))
                 });
               })
              );
      })
      .then(function () {
        model.owner.childDone(model, "transferDone", {});

      }).fail(function () {
        $('body').trigger('s2.status.error', "An error occured during the transfer process! Contact the administrator of the system.");
      });
    },


    analyseFileContent: function (data) {
      var locationsSortedByBarcode = CSVParser.convertCSVDataToJSON(data.csvAsTxt);
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
          return tube_rack;
        });
    },

    setUser: function (user) {
      this.user = user;
      this.owner.childDone(this, "userAdded");
    }
  });

  function getTubesOnRack(model, locationsSortedByBarcode) {
    var inputBarcodes = _.keys(locationsSortedByBarcode);
    var searchDeferred = $.Deferred();
    model.owner.getS2Root()
      .then(function (root) {
          return root.tubes.findByEan13Barcode(inputBarcodes, true);
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

