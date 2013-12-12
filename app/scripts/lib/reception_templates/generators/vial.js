define([], function() {
  return {
    vial: function(template, fieldMappers) {
      return {
        prepare:   _.partial(prepare, template.model),
        resources: createResources,
        manifest:  _.partial(createManifest, fieldMappers)
      }
    }
  };

  function prepare(model, preRegisterSamples, preRegisterBarcodes, details, callback) {
    var numberOfSamples   = details.number_of_labwares;
    var numberOfBarcodes  = details.number_of_labwares*details.viles_per_sample;

    var registerSamples  = _.partial(preRegisterSamples, numberOfSamples);
    var registerBarcodes = _.partial(preRegisterBarcodes, numberOfBarcodes, model);

    var placeSamples     = function(samples, barcodes, type) { 
      var barcodesPerSample = barcodes.length / samples.length;

      return _.reduce(samples, function(memo, sample) {
        var sampleArr = [sample];
        
        _.times(barcodesPerSample, function() { sampleArr.push(barcodes.shift()); });

        sampleArr.push(type);
        memo.push(sampleArr);

        return memo;
      }, []);
    };

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
    var headers = createHeaders(extractBarcodes(rows[0]).length);

    var table = _.map(rows, rowHandler);
    table.unshift(headers.concat(_.keys(extras)));

    return table;

    function rowHandler(rowData) {
      var sample   = _.first(rowData),
          type     = _.last(rowData),
          barcodes = barcoder(extractBarcodes(rowData));

      return barcodes.concat([
          sample.sanger_sample_id,
          type
        ]).concat(
           _.map(extras, _.partial(fieldValue, sample))
        );
    }

    function extractBarcodes(rowData) {
      return _.initial(_.rest(rowData));
    }

    function barcoder(barcodes) {
      return _.reduce(barcodes, function(memo, barcode) {
        memo.push(barcode.ean13,
          barcode.sanger.prefix + barcode.sanger.number + barcode.sanger.suffix);
        return memo;
      }, []);
    }

    function fieldValue(sample, f, header) {
      var mapper = mappers[header] || _.identity;
      return mapper(f(sample));
    }

    function createHeaders(numberOfBarcodes) {
      return _.reduce(_.reverseRange(numberOfBarcodes), function(memo, n) {
        memo.unshift("Sanger Barcode " + (n+1));
        memo.unshift("Tube Barcode " + (n+1));
        return memo;
      }, ["Sanger Sample ID", "SAMPLE TYPE"]);
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
