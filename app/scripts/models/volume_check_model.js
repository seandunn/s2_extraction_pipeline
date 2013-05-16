define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
  , 'extraction_pipeline/lib/csv_parser'
], function (BasePageModel, Operations, CSVParser) {
  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init:               function (owner, config) {
      this.owner = owner;
      this.config = config;
      this.inputs = $.Deferred();
      this.output = [];
      this.initialiseCaching();
      return this;
    },

    analyseFileContent: function (data) {
      var deferred = $.Deferred();
      var thisModel = this;
      var locationVolumeData = CSVParser.volumeCsvToArray(data.csvAsTxt);

      checkFileIntegrity(thisModel, locationVolumeData)
          .then(function (results) {
            if (results.action) {
              thisModel.owner.childDone(thisModel, results.action, results.data);
            }
            if (results.status == 'valid') {
              checkFileVolumes(thisModel, locationVolumeData)
                  .then(function (resultsVolumeCheck) {
                    if (resultsVolumeCheck.status === "valid" || resultsVolumeCheck.status === "undetermined") {
                      var rackData = {};
                      rackData.resourceType = 'tube_rack';
                      rackData.tubes = {};
                      _.each(locationVolumeData.array, function (volumeItem) {
                        rackData.tubes[volumeItem[0]] = {volume: volumeItem[1]};
                      });
                      thisModel.rack_data = rackData;
                      thisModel.owner.childDone(thisModel, 'fileValid', {model: rackData, message: resultsVolumeCheck.message + ' Click on the \'Save\' button to store the volumes.'});
                    } else {
                      thisModel.owner.childDone(thisModel, 'error', {message: resultsVolumeCheck.message});
                    }
                    deferred.resolve(thisModel);
                  });
            } else {
              thisModel.owner.childDone(thisModel, 'error', {message: results.message});
            }
          });
      return deferred.promise();
    },

    saveVolumes: function () {
      var model = this;

      var array = this.owner.getS2Root()
          .then(function (root) {
            return model.inputs.then(function (inputs) {
              return $.when.apply(null, _.map(inputs[0].tubes,
                  function (resource, location) {
                    return root.find(resource.uuid)
                        .then(function (tube) {
                          var volume = model.rack_data.tubes[location].volume;
                          var updateJSON = {
                            "aliquot_quantity": volume
                          };
                          return tube.update(updateJSON);
                        });
                  }
              ));
            });
          })
          .then(function () {
            return model.updateRoles();
          })
          .then(function () {
            model.owner.childDone(model, "volumesSaved", {});
          })
          .fail(function () {
            $('body').trigger('s2.status.error', "Saving of volumes has failed.")
          });

    },

    updateRoles: function () {
      var model = this;

      function makeJSONUpdateFor(role, uuid, event) {
        var updateJson = { items: {} };
        updateJson.items[role] = {};
        updateJson.items[role][uuid] = {
          event: event
        };
        return updateJson;
      }

      return model.inputs
          .then(function (inputs) {
            var rack = inputs[0];
            return rack.order()
                .then(function (order) {
                  return order.update(makeJSONUpdateFor(model.config.input.role, rack.uuid, "unuse"))
                }).then(function (order) {
                  return order.update(makeJSONUpdateFor(model.config.output[0].role, rack.uuid, "start"))
                }).then(function (order) {
                  return order.update(makeJSONUpdateFor(model.config.output[0].role, rack.uuid, "complete"))
                });
          });
    },

    setBatch: function (batch) {
      this.cache.push(batch);
      this.batch = batch;
      var model = this;
      setupInputs(model)
          .then(function () {
            model.owner.childDone(model, "batchAdded");
          })
          .fail(function () {
            $('body').trigger('s2.status.error', "couldn't load the batch resources!");
          });
    },

    setUser: function (userUUID) {
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

  function checkFileVolumes(model, locationVolumeData) {
    var deferred = $.Deferred();

    model.inputs.then(function (inputs) {
      var tubePositions = _.keys(inputs[0].tubes);
      var lastPosition = getLastPositions(tubePositions);

      // we need to check if the last tube is volume control or not...
      if ("H12" !== lastPosition || !inputs[0].tubes[lastPosition].labels) {
        // last tube is for volume checking...
        var volumeControl = _.chain(locationVolumeData["array"])
            .filter(function (tuple) {
              return tuple[0] === lastPosition
            })
            .first()
            .value()[1];
        var expectedVolume = inputs[0].tubes[lastPosition].aliquots[0].quantity;

        // TODO: fix the values used for the volume checking...
        var tolerance = 0.05;
        var volumeError = (volumeControl - expectedVolume) / expectedVolume;
        if (Math.abs(volumeError) <= tolerance) {
          deferred.resolve({status: "valid", message: "The volume control is nomimal (with " + Math.round(volumeError * 100) + "% variation)."});
        } else {
          deferred.resolve({status: "invalid", message: "The volume control is NOT nominal (by " + Math.round(volumeError * 100) + "%)."});
        }
      } else {
        deferred.resolve({status: "undetermined", message: "There is no tube for volume control."});
      }
      return deferred.promise();
    });

    return deferred.promise();
  }

  function checkFileIntegrity(model, locationVolumeData) {
    var deferred = $.Deferred();
    model.inputs.then(function (inputs) {
      var expectedNbOfTubes;
      var tubePositions = _.keys(inputs[0].tubes);
      expectedNbOfTubes = tubePositions.length;

      var arrayOfRackLocations = _.map(locationVolumeData.array, function (volItem) {
        return volItem[0];
      });
      var nbOfTubesInRack = arrayOfRackLocations.length;
      if (nbOfTubesInRack !== expectedNbOfTubes) {
        deferred.resolve({
          action: "error",
          status: "error",
          data:   {message: "The number of tube is not correct. The current batch" +
                                " contains " + expectedNbOfTubes + " tubes, while the " +
                                "current volume file contains " + nbOfTubesInRack + " tubes!"}
        });
      }
      if (inputs[0].labels && inputs[0].labels.barcode.value !== locationVolumeData.rack_barcode) {
        deferred.resolve({
          action: "error",
          status: "error",
          data:   {message: "This file is not matching the current tube rack. The current batch" +
                                " refers the rack barcoded " +  inputs[0].labels.barcode.value + ", while the " +
                                "current volume file refers to " + locationVolumeData.rack_barcode + " !"}
        });
      }
      deferred.resolve({status: "valid"});
    });

    return deferred.promise();
  }

  function getLastPositions(positions) {
    var tuple = _.chain(positions)
        .map(function (position) {
          // convert A1 -> A01
          var matches = /([a-zA-Z])(\d+)/.exec(position);
          return  [ matches[1] + ("00" + matches[2]).slice(-2), matches[1], parseInt(matches[2]) ];
        })
        .sortBy(function (trio) {
          return trio[0];
        })
        .last()
        .value();
    // reconvert A01 -> A1
    return tuple[1] + tuple[2];
  }

  return Model;
});

