define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
  , 'extraction_pipeline/csv_parser'
], function (BasePageModel, Operations, CSVParser) {
  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init:function (owner, config) {
      this.owner = owner;
      this.config = config;
      this.inputs = $.Deferred();
      this.output = [];
      this.initialiseCaching();
      return this;
    },
    createOutputs:function () {
      var model = this;
      var root;
      return model.owner.getS2Root()
        .then(function (result) {
          root = result;
          return Operations.registerLabware(
            root[model.config.output[0].model],
            model.config.output[0].aliquotType,
            model.config.output[0].purpose,
            {
              number_of_rows:8,
              number_of_columns:12,
              tubes:model.preparedTransferData
            });
        }).then(function (state) {
          model.cache.push(state.labware);
          model.owner.childDone(model, 'outputsReady', {});
          return state.labware;
        })
        .fail(function () {
          model.owner.childDone(model, "error", {message:"impossible to create the rack."});
        });
    },

    fire:function () {
      var model = this;

      function makeJSONUpdateFor(role, uuid, event) {
        var updateJson = { items:{} };
        updateJson.items[role] = {};
        updateJson.items[role][uuid] = {
          event:event
        };
        return updateJson;
      }

      model.createOutputs()
        .then(function (rack) {
          return model.batch.orders// promises not chained to make 'rack' part of the scope
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
        .then(function (inputs) {
          return $.when
            .apply(null, _.chain(inputs)
            .map(function (input) {
              return input.order.then(function (order) {
                return order.update(makeJSONUpdateFor(model.config.output[1].role, input.uuid, "start"))
              }).then(function (order) {
                  return order.update(makeJSONUpdateFor(model.config.output[1].role, input.uuid, "complete"))
                });
            })
          );
        })
        .then(function () {
          model.owner.childDone(model, "transferDone", {});

        }).fail(function () {
          model.owner.childDone(model, "error", {message:"An error occured during the validaton process!<BR/> Contact the administrator of the system."});
        });
    },
    analyseFileContent:function (data) {
      var locationVolumeData = CSVParser.volumeCsvToArray(data.csvAsTxt);

      var results = checkFileValidity(this, locationVolumeData);

      if (results.action) {
        this.owner.childDone(this, results.action, results.data);
      }

      if (results.status == 'valid') {
        var rackData = {};
        rackData.resourceType = 'tube_rack';
        rackData.tubes = {};

        _.each(locationVolumeData.array, function (volumeItem) {
          rackData.tubes[volumeItem[0]] = {volume:volumeItem[1]};
        });

        this.rack_data = rackData;
        this.owner.childDone(this, 'fileValid', {model:rackData, message:'The file has been processed properly. Click on the \'Save\' button to store the volumes.'});
      }
    },

    saveVolumes:function () {
      var model = this;

      var array = this.owner.getS2Root()
        .then(function (root) {
          return model.inputs.then(function (inputs) {
            return $.when.apply(null,_.map(inputs[0].tubes,
              function (resource, location) {
                return root.find(resource.uuid)
                  .then(function (tube) {
                    var volume = model.rack_data.tubes[location].volume;
                    var updateJSON = {
                      "aliquot_type":model.config.output[1].aliquotType,
                      "aliquot_quantity":volume
                    };
                    return tube.update(updateJSON);
                  });
              }
            ));
          });
        })
        .then(function () {
          model.owner.childDone(model, "volumesSaved", {});

        })
        .fail(function () {
          model.owner.childDone(model, "error", {message:"Saving of volumes has failed."})
        });

    },
    setBatch:function (batch) {
      this.cache.push(batch);
      this.batch = batch;
      var model = this;
      setupInputs(model)
        .then(function () {
          model.owner.childDone(model, "batchAdded");
        })
        .fail(function () {
          model.owner.childDone(model, "error", {message:"couldn't load the batch resources!"});
        });
    },
    setUser:function (userUUID) {
      this.user = userUUID;
      this.owner.childDone(this, "userAdded");
    }
  });

  function setupInputs(that) {
    var inputs = [];
    return that.batch.items.then(function (items) {
      return $.when.apply(null,
        _.chain(items)
          .filter(function (item) {
            return item.role === that.config.input.role && item.status === 'done';
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
      }).fail(that.inputs.reject);
  }

  function checkFileValidity(model, locationVolumeData) {

    var status = "valid";
    var action, message, expectedNbOfTubes;

    var arrayOfRackLocations = _.map(locationVolumeData.array, function (volItem) {
      return volItem[0];
    });

    model.inputs.then(function (inputs) {
      expectedNbOfTubes = _.keys(inputs[0].tubes).length;
    });

    var nbOfTubesInRack = arrayOfRackLocations.length;

    if (nbOfTubesInRack !== expectedNbOfTubes) {
      status = "error";
      action = "error";
      message = "The number of tube is not correct. The current batch" +
        " contains " + expectedNbOfTubes + " tubes, while the " +
        "current volume file contains " + nbOfTubesInRack + " tubes!";
    }

    return {action:action, status:status, data:{message:message}};
  }

  function prepareVolumeSaveDataPromise(model, locationVolumeData) {
    model.preparedTransferData = {};

    var resources = [];
    var promises = _.map(locationVolumeData, function (location, barcode) {
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

