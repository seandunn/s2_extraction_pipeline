define([
  "lib/underscore_extensions"
], function() {
  return {
    filter_paper: function(template, fieldMappers) {
      return {
        prepare:   _.partial(prepare, template.model),
        resources: createResources,
        manifest:  _.partial(createManifest, fieldMappers)
      };
    }
  };

  // Filter papers are pre-barcoded, but we'll still generate barcodes and pretend they are labelled with these.
  // When the manifest is returned we'll attach the barcode that was specified, which may well be the pre-barcoded
  // one.  Even though there are two locations on the filter paper, they contain the same sample.
  function prepare(model, preRegisterSamples, preRegisterBarcodes, details, callback) {
    var numberOfSamples  = details.number_of_labwares;
    var registerSamples  = _.partial(preRegisterSamples, numberOfSamples);
    var registerBarcodes = _.partial(preRegisterBarcodes, numberOfSamples, model);

    var placeSamples     = function(samples, barcodes, type) { return _.zip(samples, barcodes, _.repeat(type, barcodes.length)); };

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
    return _.chain(filter_paper.aliquots)
            .find(_.complement(_.isEmpty))
            .value()
            .sample;
  }

  // Filter papers have the sample sample in both locations.
  function prepareRequest(type, memo, row) {
    var aliquot      = [{sample_uuid: row[0].uuid, type: type.aliquot}];

    memo.push({
      _barcode:              row[1],
      aliquots:              aliquot
    });
    return memo;
  }

  function createManifest(mappers, rows, extras) {
    var headers = ["Barcode", "Sanger Barcode", "Sanger Sample ID", "SAMPLE TYPE"];
    var table   = _.map(rows, rowHandler);
    table.unshift(headers.concat(_.keys(extras)));
    return table;

    function rowHandler(row) {
      var sample = row[0], labels = row[1], type = row[2];

      return [
        labels.ean13,
        labels.sanger.prefix + labels.sanger.number + labels.sanger.suffix,
        sample.sanger_sample_id,
        type
      ].concat(
        _.map(extras, _.partial(fieldValue, sample))
      );
    }

    function fieldValue(sample, f, header) {
      var mapper = mappers[header] || _.identity;
      return mapper(f(sample));
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
