define([
  "models/base_page_model",
  "lib/csv_parser"
], function (BasePageModel, CSVParser) {
  "use strict";

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init: function (owner, config, inputModel) {
      this.class = "VolumeCheckModel";
      this.owner = owner;
      this.config = config;
      this.rack = inputModel.initialLabware;
      this.output = [];
      this.initialiseCaching();

      _.extend(this, inputModel);
      return this;
    },

    parseVolumeFile:function (data) {
      var csvArray = $.csv.toArrays(data);
      var reBarcode = /\s*(\w)(\d\d)\s*/i
      var tubes = _.chain(csvArray).drop()
        .reduce(function (memo, row) {
          var matches = reBarcode.exec(row[1]);

          if (matches) {
            var locationLetter = matches[1];
            var locationNumber = parseInt(matches[2]);
            memo[ (locationLetter + locationNumber).trim() ] = parseFloat(row[2].trim());
          }
          return memo;
        }, {}).value();

      return {
        rackBarcode:  csvArray[1][0].replace(/ /g,''),
        tubes:        tubes
      };

    },

    analyseFileContent: function (data) {
      var deferred = $.Deferred();
      var thisModel = this;
      var parsedVolumes = this.parseVolumeFile(data.csvAsTxt);


      checkFileIntegrity(thisModel, parsedVolumes).then(function (validatedVolumes) {


        thisModel.rackData = rackData;

        // thisModel.owner.childDone(thisModel, "fileValid", {model: rackData, message:  "Volume File valid. Click on the 'Save' button to store the volumes."});

        return deferred.resolve(thisModel);
      }, function(errorMessage){
        thisModel.owner.childDone(thisModel, "error", errorMessage);
        return deferred.reject(errorMessage);
      });

      return deferred.promise();
    },

    saveVolumes: function () {
      var model = this;

      var array = this.owner.getS2Root()
      .then(function (root) {
        return model.inputs.then(function (inputs) {
          return $.when.apply( null,
                              _.map(inputs[0].tubes, function (resource, location) {
                                return root.find(resource.uuid).then(function (tube) {
                                  var volume = model.rackData.tubes[location].volume;
                                  var updateJSON = { "aliquot_quantity": volume };
                                  return tube.update(updateJSON);
                                });
                              }));
        });
      })
      .then(function () {
        return model.updateRoles();
      })
      .then(function () {
        model.owner.childDone(model, "volumesSaved", {});
      })
      .fail(function () {
        $("body").trigger("s2.status.error", "Saving of volumes has failed.");
      });

    },

    updateRoles: function () {
      var model = this;

      function makeJSONUpdateFor(role, uuid, event) {
        var updateJson = { items: {} };
        updateJson.items[role] = {};
        updateJson.items[role][uuid] = {
          event: event,
          batch_uuid: model.batch.uuid
        };
        return updateJson;
      }

      return model.inputs
      .then(function (inputs) {
        var rack = inputs[0];
        return rack.order()
        .then(function (order) {
          return order.update(makeJSONUpdateFor(model.config.input.role, rack.uuid, "unused"));
        }).then(function (order) {
          return order.update(makeJSONUpdateFor(model.config.output[0].role, rack.uuid, "start"));
        }).then(function (order) {
          return order.update(makeJSONUpdateFor(model.config.output[0].role, rack.uuid, "complete"));
        });
      });
    },

  });

  function setupInputs(that) {
    var inputs = [];
    return that.batch.items.then(function (items) {
      return $.when.apply(null, _.chain(items).filter(function (item) {
        return item.role === that.config.input.role && item.status === "done";
      }).map(function (item) {
        return that.cache.
          fetchResourcePromiseFromUUID(item.uuid).
          then(function (resource) { inputs.push(resource); });
      }).value());
    })
    .then(function () {
      return that.inputs.resolve(inputs);
    }).fail(that.inputs.reject);
  }

  // // Check that volumes are within tolerance...
  // function checkFileVolumes(model, parsedVolumes) {
  //   var deferred = $.Deferred();

  //   model.inputs.then(function (inputs) {
  //     var tubePositions = _.keys(inputs[0].tubes);
  //     var lastPosition = getLastPositions(tubePositions);

  //     // we need to check if the last tube is volume control or not...
  //     if ("H12" !== lastPosition || !inputs[0].tubes[lastPosition].labels) {
  //       // last tube is for volume checking...
  //       var volumeControl = _.chain(parsedVolumes["array"])
  //       .filter(function (tuple) {
  //         return tuple[0] === lastPosition
  //       })
  //       .first()
  //       .value()[1];
  //       var expectedVolume = inputs[0].tubes[lastPosition].aliquots[0].quantity;

  //       // TODO: fix the values used for the volume checking...
  //       var tolerance = 0.05;
  //       var volumeError = (volumeControl - expectedVolume) / expectedVolume;
  //       if (Math.abs(volumeError) <= tolerance) {
  //         deferred.resolve({status: "valid", message: "The volume control is nomimal (with " + Math.round(volumeError * 100) + "% variation)."});
  //       } else {
  //         deferred.resolve({status: "invalid", message: "The volume control is NOT nominal (by " + Math.round(volumeError * 100) + "%)."});
  //       }
  //     } else {
  //       deferred.resolve({status: "undetermined", message: "There is no tube for volume control."});
  //     }
  //     return deferred.promise();
  //   });

  //   return deferred.promise();
  // }

  // A valid MicroLab volume files should have 3 columns
  // 1st column: rack EAN13 barcode
  // 2nd column: Tube location e.g. A01, B01, etc.
  // 3rd column: Tube volume in uL
  //
  // There should be a volume for every location even empty wells.
  function checkFileIntegrity(model, parsedVolumes) {
    var deferred = $.Deferred();

    var rack = model.rack;

      if (rack.labels.barcode.value === parsedVolumes.rackBarcode) {
        deferred.resolve(parsedVolumes);
      } else {
        // This should use Q style exception handling and get rid of the extra
        // deferred
        deferred.reject("This file does not match the current Tube Rack.");
      }

    return deferred.promise();
  }

  // function getLastPositions(positions) {
  //   var tuple = _.chain(positions)
  //   .map(function (position) {
  //     // convert A1 -> A01
  //     var matches = /([a-zA-Z])(\d+)/.exec(position);
  //     return  [ matches[1] + ("00" + matches[2]).slice(-2), matches[1], parseInt(matches[2]) ];
  //   })
  //   .sortBy(function (trio) {
  //     return trio[0];
  //   })
  //   .last()
  //   .value();
  //   // reconvert A01 -> A1
  //   return tuple[1] + tuple[2];
  // }

  return Model;
});

