define([
  'models/base_page_model'
  , 'mapper/operations'
  , 'lib/json_templater'
], function (BasePageModel, Operations, JsonTemplater) {
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
              var blob      = generateCSVBlob(template.generator.manifest(data));

              var manifest  = sendManifestRequest(template, blob).fail(fail);
              var resources = template.generator.resources(root, data).then(_.partial(labelResources, root, model)).fail(fail);

              return $.when(resources, manifest);
            }).then(function(model, manifest) {
              model.manifestBlob = manifest;
              return model;
            }, _.partial(fail, "Couldn't associate the barcodes to the labware."))
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

  function plateCSVBlob(rows) {
    return generateCSVBlob(
       ["Plate Barcode", "Sanger Barcode", "Location", "Sanger Sample ID", "SAMPLE TYPE"],
       _.map(rows, rowHandler)
    );

    function rowHandler(row) {
      var sample = row[0], label = row[1], location = row[2], type = row[3];
      return [
        label.ean13,
        label.sanger.prefix + label.sanger.number + label.sanger.suffix,
        location,
        sample.sanger_sample_id,
        type
      ];
    }
  }

  function generateCSVBlob(table) {
    return new Blob([ _.toCSV(table, ",") ], { type: "text/csv" });
  }

  // TODO: Use jQuery because this is fugly
  function sendManifestRequest(template,manifestBlob) {
    return getXLSTemplate(template).then(function(templateBlob){
      var deferred = $.Deferred();
      try {
        var xhr = new XMLHttpRequest;
        xhr.open("POST", 'http://psd2g.internal.sanger.ac.uk:8100/manifest-merge-service/');
        xhr.responseType = "blob";
        xhr.onerror = function (oEvent) {
          deferred.reject("Unable to send the manifest... Is the XLS merger server up and running?");
        };
        xhr.onload = function (oEvent) {
          deferred.resolve(this.response);
        };

        var form = new FormData();
        form.append("template",templateBlob);
        form.append("manifest-details",manifestBlob);
        xhr.send(form);
      } catch (err) {
        var message = " msg:" + err.message;
        message += "\n" + err.code;
        message += "\n" + err.name;
        message += "\n" + err.stack;
        deferred.reject(message);
      }
      return deferred.promise();
    });
  }
  function getXLSTemplate(template) {
    var deferred = $.Deferred();
    var oReq = new XMLHttpRequest();
    oReq.open("GET", template.manifest_path, true);
    oReq.responseType = "blob";
    oReq.onload = function(oEvent) { deferred.resolve(oReq.response); };
    oReq.onerror = function(oEvent) { deferred.reject("Unable to load the template"); };
    oReq.send();
    return deferred.promise();
  }

  function fail(m) {
    return {message: m};
  }
});
