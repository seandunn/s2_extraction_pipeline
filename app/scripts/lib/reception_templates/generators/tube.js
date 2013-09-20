define([], function() {
  return {
    tube: function(template) {
      return {
        prepare:   _.partial(prepare, template.model),
        resources: _.partial(createTubes, template.aliquot_type),
        manifest:  tubeManifest
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

  // Functions used in the creation of resources for the manifest
  function createTubes(type, root, manifest) {
    var sampleBarcodes =
      _.chain(manifest)
       .map(function(r) { return [r[0].uuid, r[1]]; })
       .object()
       .value();

    var builder = _.compose(
      function(tube) { tube.labels = sampleBarcodes[tube.aliquots[0].sample.uuid]; return tube; },
      function(raw)  { return root.tubes.instantiate({ rawJson: {tube: raw} }); }
    )

    return root.bulk_create_tubes.create({
      tubes: _.map(manifest, _.compose(createAliquotForSample, _.first))
    }).then(function(bulk) {
      return _.map(bulk.result.tubes, builder);
    }, function() {
      return "Couldn't register the tubes";
    });

    function createAliquotForSample(sample) {
      return {
        aliquots:[{
          sample_uuid: sample.uuid,
          type:        type
        }]
      };
    }
  }

  function tubeManifest(rows) {
    var table = _.map(rows, rowHandler);
    table.unshift(["Tube Barcode", "Sanger Barcode", "Sanger Sample ID", "SAMPLE TYPE"]);
    return table;

    function rowHandler(trio) {
     var sample = trio[0], label = trio[1], type = trio[2];
     return [
       label.ean13,
       label.sanger.prefix + label.sanger.number + label.sanger.suffix,
       sample.sanger_sample_id,
       type
     ];
    }
  }
});
