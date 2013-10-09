define([
  "lib/underscore_extensions"
], function() {
  var locations = ["A1", "A2"];

  return {
    filter_paper: function(template) {
      return {
        prepare:   _.partial(prepare, template.model),
        resources: createResources,
        manifest:  createManifest
      };
    }
  };

  // Filter papers are pre-barcoded, but we'll still generate barcodes and pretend they are labelled with these.
  // When the manifest is returned we'll attach the barcode that was specified, which may well be the pre-barcoded
  // one.  Even though there are two locations on the filter paper, they contain the same sample.
  function prepare(model, preRegisterSamples, preRegisterBarcodes, numberOfLabwares, callback) {
    var numberOfSamples  = numberOfLabwares;
    var registerSamples  = _.partial(preRegisterSamples, numberOfSamples);
    var registerBarcodes = _.partial(preRegisterBarcodes, numberOfSamples, model);

    var placeSamples = function(samples, barcodes, type) {
      return _.chain(samples)
              .zip(barcodes)
              .zip(_.pluck(samples, "sanger_sample_id"))
              .map(function(pair) { return [pair[0][0], _.extend(pair[0][1], {identifier:pair[1]}), pair[1], type]; })
              .value();
    };

    // Because of the pre-barcoded nature of filter papers we don't need to generate labels, just labellables.
    return callback(registerSamples, registerBarcodes, placeSamples, labeller);
  }

  function createResources(type, callback) {
    return callback(
      "filter_papers",
      representativeSample,
      _.partial(prepareRequest, type)
    );
  }

  function representativeSample(filter_paper) {
    return _.chain(filter_paper.locations)
            .find(_.complement(_.isEmpty))
            .first()
            .value()
            .sample;
  }

  // Filter papers have the sample sample in both locations.
  function prepareRequest(type, memo, row) {
    var aliquot      = [{sample_uuid: row[0].uuid, type: type}];
    var descriptions = _.chain(locations).map(function(f) { return [f,aliquot]; }).object().value();

    memo.push({
      _barcode:              row[1],
      number_of_rows:        1,
      number_of_columns:     2,
      locations_description: descriptions
    });
    return memo;
  }

  function createManifest(rows, extras) {
    var headers = ["Barcode", "Sanger Sample ID", "SAMPLE TYPE"];
    var table   = _.map(rows, rowHandler);
    table.unshift(headers.concat(_.keys(extras)));
    return table;

    function rowHandler(row) {
      var sample = row[0], labels = row[1], type = row[3];
      return [
        labels.ean13,
        sample.sanger_sample_id,
        type
      ].concat(
        _.map(extras, function(f, h) { return sample[f]; })
      );
    }
  }

  function labeller(labels) {
    return {
      identifier: {
        type: "text",
        value: labels.identifier
      },
      barcode: {
        type: "ean13-barcode",
        value: labels.ean13
      }
    };
  }
});
