define([
  "lib/underscore_extensions"
], function() {
  return {
    plate: function(template) {
      return {
        prepare:   _.partial(prepare, template.model),
        resources: createResources,
        manifest:  createManifest
      };
    }
  };

  function prepare(model, preRegisterSamples, preRegisterBarcodes, numberOfLabwares, callback) {
    var numberOfSamples   = numberOfLabwares * 96;
    var numberOfBarcodes  = numberOfLabwares;

    var registerSamples  = _.partial(preRegisterSamples, numberOfSamples);
    var registerBarcodes = _.partial(preRegisterBarcodes, numberOfBarcodes, model);

    var locations = _.map(_.crossProduct(
      ["A","B","C","D","E","F","G","H"],
      _.range(1, 13)
    ), function(pair) {
      return pair.join("");
    });

    var placeSamples = function(samples, barcodes, type) {
      return _.chain(samples)
              .zip(_.crossProduct(barcodes, locations))
              .map(function(pair) { return [pair[0], pair[1][0], pair[1][1], type]; })
              .value();
    };

    return callback(registerSamples, registerBarcodes, placeSamples, labelForBarcode);
  }

  function createResources(type, callback) {
    return callback(
      'plates',
      representativeSample,
      _.partial(prepareRequest, type)
    );
  }

  function representativeSample(plate) {
    return _.chain(plate.wells)
            .find(_.complement(_.isEmpty))
            .first()
            .value()
            .sample;
  };

  function prepareRequest(type, memo, row) {
    var aliquot = _.build(row[2], [{sample_uuid: row[0].uuid, type: type}]);

    var plate = _.find(memo, function(p) { return p._barcode === row[1]; });
    if (_.isUndefined(plate)) {
      plate = {_barcode:row[1], wells_description:{}};
      memo.push(plate);
    }
    plate.wells_description = _.extend(plate.wells_description, aliquot);

    return memo;
  }

  function createManifest(rows, extras) {
    var headers = ["Plate Barcode", "Sanger Barcode", "Location", "Sanger Sample ID", "SAMPLE TYPE"]
    var table   = _.map(rows, rowHandler);
    table.unshift(headers.concat(_.keys(extras)));
    return table;

    function rowHandler(row) {
      var sample = row[0], label = row[1], location = row[2], type = row[3];
      return [
        label.ean13,
        label.sanger.prefix + label.sanger.number + label.sanger.suffix,
        location,
        sample.sanger_sample_id,
        type
      ].concat(
        _.map(extras, function(f, h) { return sample[f]; })
      );
    }
  }

  function labelForBarcode(barcode) {
    return {
      barcode:        {
        type:  "ean13-barcode",
        value: barcode.ean13
      },
      "sanger label": {
        type:  "sanger-barcode",
        value: barcode.sanger.prefix + barcode.sanger.number + barcode.sanger.suffix
      }
    };
  }
});
