define([], function() {
  return {
    tube: function(template, fieldMappers) {
      return {
        prepare:   _.partial(prepare, template.model),
        resources: createResources,
        manifest:  _.partial(createManifest, fieldMappers)
      }
    }
  };

  function prepare(model, preRegisterSamples, preRegisterBarcodes, details, callback) {
    var numberOfSamples   = details.number_of_labwares;
    var numberOfBarcodes  = details.number_of_labwares;

    var registerSamples  = _.partial(preRegisterSamples, numberOfSamples);
    var registerBarcodes = _.partial(preRegisterBarcodes, numberOfBarcodes, model);
    var placeSamples     = function(samples, barcodes, type) { return _.zip(samples, barcodes, _.repeat(type, barcodes.length)); };
    return callback(registerSamples, registerBarcodes, placeSamples, labelForBarcode);
  }

  function createResources(type, callback) {
    return callback(
      'tubes',
      representativeSample,
      _.partial(prepareRequest, type)
    );
  }

  function representativeSample(tube) {
    return tube.aliquots[0].sample;
  };

  function prepareRequest(type, memo, row) {
    var aliquot = {sample_uuid: row[0].uuid, type: type.aliquot};
    memo.push({ aliquots: [ aliquot ] });
    return memo;
  }

  function createManifest(mappers, rows, extras) {
    var headers = ["Tube Barcode", "Sanger Barcode", "Sanger Sample ID", "SAMPLE TYPE"];
    var table   = _.map(rows, rowHandler);
    table.unshift(headers.concat(_.keys(extras)));
    return table;

    function rowHandler(trio) {
     var sample = trio[0], label = trio[1], type = trio[2];
     return [
       label.ean13,
       label.sanger.prefix + label.sanger.number + label.sanger.suffix,
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
