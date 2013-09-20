define([
  'models/base_page_model',
  'config'
], function (BasePageModel, Config) {
  'use strict';

  var ReceptionModel = Object.create(BasePageModel);

  $.extend(ReceptionModel, {

    init: function (owner, config) {
      this.owner = owner;
      this.inputs = $.Deferred();
      this.config = config;
      return $.Deferred().resolve(this).promise();
    },

    reset:function(){
      this.manifestBlob   = undefined;
      this.labwareOutputs = undefined;
    },

    generateSamples: function (template, study, sampleType, numberOfLabwares) {
      var model              = this;
      var sangerSampleIdCore = study.sanger_sample_id_core;

      return template.generator.prepare(
        preRegisterSamples,
        preRegisterBarcodes,
        numberOfLabwares,
        function(registerSamples, registerBarcodes, placeSamples) {
          return model.owner.getS2Root().then(function(root) {
            // We know, up front, how many samples are being created and therefore how many barcodes
            // we're going to need at the end of the process.  Hence, we can perform the bulk sample
            // and bulk barcode creation in parallel.
            var samples  = registerSamples(sampleType, sangerSampleIdCore, root).fail(fail);
            var barcodes = registerBarcodes(sampleType, root).fail(fail);

            return $.when(samples, barcodes).then(function(samples, barcodes) {
              // We can create the labware and label it at the same time as producing the
              // manifest XLS file
              var data      = placeSamples(samples, barcodes, sampleType);
              var blob      = _.toCSV(template.generator.manifest(data), ",");

              var manifest  = sendManifestRequest(template, blob).fail(fail);
              var resources = createResources(template.generator.resources, root, data).then(_.partial(labelResources, root, model)).fail(fail);

              return $.when(resources, manifest);
            }).then(function(model, manifest) {
              model.manifestBlob = manifest;
              return model;
            }, fail);
          }, _.partial(fail, "Couldn't get the root! Is the server accessible?"));
        }
      );
    },

    printBarcodes: function (printerName) {
      var deferred = $.Deferred();
      var thisModel = this;
      BasePageModel.printBarcodes(thisModel.labwareOutputs, printerName)
                   .then(function(){
                     return deferred.resolve(thisModel);
                   }, function(){
                     return deferred.reject({message: "Couldn't print the barcodes."});
                   })
      return deferred.promise();
    },

  });

  return ReceptionModel;

  // These two functions can run in parallel
  function preRegisterSamples(number, type, core, root) {
    return root.bulk_create_samples.create({
      state:                 "draft",
      quantity:              number,
      sample_type:           type,
      sanger_sample_id_core: core
    }).then(function(action) {
      return action.result.samples;
    }, function() {
      return "Could not pre-register " + number + " samples in S2.";
    });
  }
  function preRegisterBarcodes(number, model, type, root) {
    return root.bulk_create_barcodes.create({
      number_of_barcodes: number,
      labware:            model,
      role:               "stock",
      contents:           type
    }).then(function(action) {
      return action.result.barcodes;
    }, function() {
      return "Could not pre-register " + number + " barcodes in S2.";
    });
  }
  function labelResources(root, model, resources) {
    model.labwareOutputs = resources;
    return root.bulk_create_labellables.create({
      labellables: _.map(model.labwareOutputs, labellableForResource)
    }).then(function() {
      return model;
    }, function() {
      return "Couldn't connect the labware to their labels in S2.";
    });
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

  function labellableForResource(resource) {
    return {
      name: resource.uuid,
      type: "resource",
      labels: labelForBarcode(resource.labels)
    };
  }

  function sendManifestRequest(template,csv) {
    return binaryAjax({
      type: "GET",
      url:  template.manifest_path,
    }).then(function(xls) {
      // Encode the data in such a way that we get a multi-part MIME body, otherwise all we
      // get is form data which doesn't work with the manifest merge service.
      var form = new FormData();
      form.append("template",         xls);
      form.append("manifest-details", new Blob([csv], {type:"text/csv"}));

      return binaryAjax({
        type: "POST",
        url:  Config.mergeServiceUrl,
        data: form
      });
    }).fail(function() {
      return "Unable to generate the manifest";
    });
  }

  // Performing Ajax with binary data through jQuery isn't really possible as the data comes
  // back and gets converted to a string, which is treated as Unicode and becomes invalid in
  // the process.  So here we drop to XMLHttpRequest in such a way that we can deal with the
  // data using Blob.
  function binaryAjax(options) {
    var deferred = $.Deferred();
    var fail     = function() { deferred.reject("Communications error with backend systems!"); };

    var xhr      = new XMLHttpRequest;
    xhr.open(options.type, options.url, true);
    xhr.responseType = "blob";
    xhr.onerror      = fail;
    xhr.onload       = function() {
      if (isServerOk(xhr)) {
        deferred.resolve(xhr.response);
      } else {
        fail();
      }
    };
    xhr.send(options.data);
    return deferred.promise();
  }
  function isServerOk(xhr) {
    return xhr.status === 200;
  }

  function createResources(helper, root, manifest) {
    return helper(function(model, sampleFor, prepareRequest) {
      var sampleBarcodes =
        _.chain(manifest)
         .map(function(r) { return [r[0].uuid, r[1]]; })
         .object()
         .value();

      var builder = _.compose(
        function(resource) {
          resource.labels = sampleBarcodes[sampleFor(resource).uuid];
          return resource;
        },
        function(raw) {
          return root[model].instantiate(_.build("rawJson", model.singularize(), raw));
        }
      );

      // Remove any temporary information that might have been stored in the data for creation.
      // Creating plates does this because it needs barcodes to group samples correctly.
      var data   = _.reduce(manifest, prepareRequest, []);
      var fields = _.chain(data).map(_.keys).flatten().uniq().filter(function(v) { return v[0] === "_"; }).value();

      return root["bulk_create_" + model].create(
        _.build(model, _.map(data, function(o) { return _.omit(o, fields); }))
      ).then(function(bulk) {
        return _.map(bulk.result[model], builder);
      }, function() {
        return "Could not register the labware";
      });
    });
  }

  function fail(m) {
    return {message:m};
  }
});
