define([
  "models/base_page_model",
  "labware/presenter"
], function (BasePageModel, LabwarePresenter) {
  "use strict";

  var Model = Object.create(BasePageModel);

  function parseVolumeFile(csvAsTxt) {
    var csvArray = $.csv.toArrays(csvAsTxt);
    var reBarcode = /\s*(\w)(\d\d)\s*/i;

    var tubes = _.chain(csvArray)
      .drop()
      .reduce(function (memo, row) {
        var matches = reBarcode.exec(row[1]);

        if (matches) {
          var locationLetter = matches[1];
          var locationNumber = parseInt(matches[2], 10);
          memo[(locationLetter + locationNumber).trim()] = parseFloat(row[2].trim());
        }

        return memo;
      }, {})
      .value();

    return {
      rackBarcode:  csvArray[1][0].replace(/ /g,""),
      tubes:        tubes
    };
  }

  function checkFileIntegrity(model, parsedVolumes) {
    // A valid MicroLab volume files should have 3 columns
    // 1st column: rack EAN13 barcode
    // 2nd column: Tube location e.g. A01, B01, etc.
    // 3rd column: Tube volume in uL
    //
    // There should be a volume for every location even empty wells.
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

  function updateJSON(uuid,newRole, oldRole) {
    var updateJson = { items: {} };
    var newEvent   = "start";

    if (oldRole){
      updateJson.items[oldRole]       = {};
      updateJson.items[oldRole][uuid] = { event: "unuse" };

      newEvent = "complete";
    }

    updateJson.items[newRole]       = {};
    updateJson.items[newRole][uuid] = { event: newEvent };

    return updateJson;
  }

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

    analyseFileContent: function (csvAsTxt) {
      var thisModel     = this;
      var parsedVolumes = parseVolumeFile(csvAsTxt);

      return checkFileIntegrity(thisModel, parsedVolumes).then(function (validatedVolumes) {
        thisModel.validatedVolumes = validatedVolumes;
        return thisModel;
      });

    },

    save: function () {
      var model      = this;
      var inputRole  = model.config.input.role;
      var outputRole = model.config.output[0].role;

      return model.owner
      .getS2Root()

      .then(function (root) {
        var tubeVolumes = _
        .reduce(model.rack.tubes, function(memo, tube, location){
          memo[location] = {
            tube_uuid:  tube.uuid,
            volume:     model.validatedVolumes.tubes[location]
          };

          return memo;
        }, {});

        return model.rack.update({ tubes: tubeVolumes});
      })

      .then(function(tubeRack){
        // Add new role of volume_checked: in_progess
        return tubeRack.orders();
      }, function (errorMessage) {
        return "Saving of volumes has failed: " + errorMessage;
      })

      .then(function(orders) {
        var orderPromises = _.map(orders, function (order) {
          return order
          .update(updateJSON(model.rack.uuid, outputRole))
          .then(function(order) {
            return order.update(updateJSON(model.rack.uuid, outputRole, inputRole))
          });
        });

        return $.when.apply(undefined, orderPromises);
      })
      .then(function() {
        return "Volume check complete.";
      });

    }
  });

  return Model;
});

