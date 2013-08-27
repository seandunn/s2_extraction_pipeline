define([
  "models/base_page_model",
], function (BasePageModel) {
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

  $.extend(Model, {
    init: function (owner, config, inputModel) {
      this.class = "VolumeCheckRackModel";
      this.owner = owner;
      this.config = config;
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

    saveVolumes: function () {
      var model = this;
        debugger

      return this.owner.getS2Root()
      .then(function (root) {
        var tubeVolumes = _.reduce(model.rack.tubes, function(memo, tube, location){
          memo[location] = {
            tube_uuid: tube.uuid,
            volume: model.validatedVolumes.tubes[location]
          }

          return memo;
        }, {});

        model.rack.update({ tubes: tubeVolumes});
      })
      .fail(function (errorMessage) {
        return "Saving of volumes has failed: " + errorMessage;
      })
      .then(function(tubeRack){
        // Add new role of volume_checked: in_progess
        return orders
      })
      .then(function(orders){
        // change old role to unused and new role to done.
      });

    }
  });

  return Model;
});

