//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  "models/base_page_model",
  "lib/file_handling/volume",
  "labware/presenter"
], function (BasePageModel, FileHandler, LabwarePresenter) {
  "use strict";

  var Model = Object.create(BasePageModel);

  _.extend(Model, LabwarePresenter, {
    init: function (owner, config, inputModel) {
      this.className = "VolumeCheckRackModel";
      this.owner = owner;
      this.config = config;
      this.expected_type = "tube_rack";
      this.rack = inputModel.initialLabware;
      this.output = [];
      this.initialiseCaching();

      _.extend(this, inputModel);
      return this;
    },

    analyseFileContent: function (csv) {
      var deferred = $.Deferred();
      var parsed = FileHandler.from(csv);
      var rack = this.rack;

      if (parsed.rack_barcode !== rack.labels.barcode.value) {
        deferred.reject("The uploaded file is for '" + parsed.rack_barcode + "' " +
                        "not '" + rack.labels.barcode.value + "'");
      } else {
        var scored = 
          _.chain(parsed.tubes)
           .map(_.partial(scoreTubes, this.config.thresholds, rack))
           .object()
           .value();

        this.validatedVolumes = _.object(parsed.tubes);

        deferred.resolve({
          rack: {
            resourceType: "tube_rack",
            locations: scored,
            barcode: parsed.rack_barcode
          }
        });
      }

      return deferred.promise();
    },

    save: function () {
      var model      = this;
      var inputRole  = model.config.input.role;
      var outputRole = model.config.output[0].role;

      var tubeVolumes =
        _.chain(model.rack.tubes)
         .map(function(tube, location) { return [location, {tube_uuid: tube.uuid, volume: model.validatedVolumes[location]}]; })
         .object()
         .value();

      return model.rack
                  .update({ tubes: tubeVolumes })
                  .then(function(tubeRack){
                    return tubeRack.orders();
                  }, function (errorMessage) {
                    return "Saving of volumes has failed: " + errorMessage;
                  })
                  .then(updateOrders)
                  .then(function() { return "Volume check complete."; });

      function updateOrders(orders) {
        return $.when.apply(undefined, _.map(orders, function(order) {
          return order.update(start(model.rack.uuid, outputRole))
                      .then(function(order) {
                        return order.update(complete(model.rack.uuid, outputRole, inputRole));
                      });
        }));
      }
    }
  });

  return Model;

  function scoreTubes(thresholds, rack, details) {
    var location = details[0], volume = details[1];
    return [location, score(thresholds, volume, rack.tubes[location])];
  }
  function score(thresholds, volumeInFile, tubeInRack) {
    var score = _.find(thresholds, _.partial(overThreshold, volumeInFile))[1];
    if (_.isUndefined(tubeInRack) && !isAcceptableForEmptySlot(score)) {
      return "data-not-resource";
    } else {
      return score;
    }
  }
  function overThreshold(volume, threshold) {
    return _.isNull(threshold[0]) || (volume < threshold[0]);
  }
  function isAcceptableForEmptySlot(score) {
    return (score == "empty") || (score == "error");
  }

  function start(uuid, role) {
    return _.build('items', role, uuid, 'event', 'start');
  }
  function complete(uuid, roleToComplete, roleToUnuse) {
    return _.build('items', _.object([
      [roleToUnuse,    _.build(uuid, {event:"unuse"})],
      [roleToComplete, _.build(uuid, {event:"complete"})]
    ]));
  }
});

