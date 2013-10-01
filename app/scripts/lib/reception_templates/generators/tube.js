define([], function() {
  return {
    tube: function(template) {
      return {
        prepare:   _.partial(prepare, template.model),
        resources: createResources,
        manifest:  createManifest
      }
    }
  };

  function prepare(model, preRegisterSamples, preRegisterBarcodes, numberOfLabwares, callback) {
    var numberOfSamples   = numberOfLabwares;
    var numberOfBarcodes  = numberOfLabwares;

    var registerSamples  = _.partial(preRegisterSamples, numberOfSamples);
    var registerBarcodes = _.partial(preRegisterBarcodes, numberOfBarcodes, model);
    var placeSamples     = function(samples, barcodes, type) { return _.zip(samples, barcodes, _.repeat(type, barcodes.length)); };
    return callback(registerSamples, registerBarcodes, placeSamples);
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
    var aliquot = {sample_uuid: row[0].uuid, type: type};
    memo.push({ aliquots: [ aliquot ] });
    return memo;
  }

  function createManifest(rows, extras) {
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
       _.map(extras, function(f, h) { return sample[f]; })
     );
    }
  }
});
