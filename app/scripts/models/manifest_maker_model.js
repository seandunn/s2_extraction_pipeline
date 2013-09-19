define([
  'models/base_page_model'
  , 'mapper/operations'
  , 'lib/json_templater'
  , 'lib/reception_templates'
  , 'lib/reception_studies'
], function (BasePageModel, Operations, JsonTemplater, ReceptionTemplates, ReceptionStudies) {
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
      delete this.currentTemplateBlob;
      delete this.manifestCsvBlob;
      delete this.labwareOutputs;
    },

    generateSamples: function (templateName, study, sampleType, nbOfSample) {
      var deferred = $.Deferred();
      var thisModel = this;
      thisModel.getXLSTemplate(templateName)
          .fail(function(error){
            return deferred.reject({message:"Couldn't load the specified template: "+templateName, previous_error:error});
          })
          .then(function(templateBlob){
            thisModel.currentTemplateBlob = templateBlob;
            return thisModel.getLabellables(templateName, study, sampleType, nbOfSample);
          })
          .then(function(){
            return deferred.resolve();
          });
      return deferred.promise();
    },

    getXLSTemplate: function (templateName, nbOfSample) {
      var deferred = $.Deferred();
      var oReq = new XMLHttpRequest();
      oReq.open("GET", ReceptionTemplates[templateName].manifest_path, true);
      oReq.responseType = "blob";
      oReq.onload = function(oEvent) {
        var blob = oReq.response;
        deferred.resolve(blob);
      };
      oReq.onerror = function(oEvent) {
        deferred.reject({message:"error"});
      };
      oReq.send();
      return deferred.promise();
    },

    getLabellables: function (templateName, studyName, sampleType, nbOfSample) {
      var deferred = $.Deferred();
      var fail     = function(m) { return deferred.fail({message: m}); };

      var thisModel = this;
      var root;
      var labwareModel = ReceptionTemplates[templateName].model;
      var sangerSampleIdCore = ReceptionStudies[studyName].sanger_sample_id_core;
      var aliquotType = ReceptionTemplates[templateName].aliquot_type;

      thisModel.owner.getS2Root()
          .then(function(root) {
            // We know, up front, how many samples are being created and therefore how many barcodes
            // we're going to need at the end of the process.  Hence, we can perform the bulk sample
            // and bulk barcode creation in parallel.
            var samples  = preRegisterSamples(root, nbOfSample, sampleType, sangerSampleIdCore).fail(fail);
            var barcodes = preRegisterBarcodes(root, nbOfSample, labwareModel, sampleType).fail(fail);

            return $.when(samples, barcodes).then(function(samples, barcodes) {
              // We can pair up the samples to a barcode now
              thisModel.sampleBarcodes = 
                _.chain(samples)
                 .zip(barcodes)
                 .indexBy(function(pair) { return pair[0].uuid; })
                 .value();
              return thisModel;
            }).then(function(model) {
              // We can create the labware and label it at the same time as producing the
              // manifest XLS file
              var manifest = generateManifest(sampleType, thisModel.currentTemplateBlob, thisModel.sampleBarcodes).fail(fail);
              var tubes    = createLabelledTubes(thisModel, root, labwareModel, aliquotType).fail(fail);
              return $.when(tubes, manifest);
            })
            .then(function(labellables, manifest) {
              thisModel.manifestBlob = manifest;
              deferred.resolve(thisModel);
            }, _.partial(fail, "Couldn't associate the barcodes to the tubes."))
          }, _.partial(fail, "Couldn't get the root! Is the server accessible?"));

      return deferred.promise();
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
  function preRegisterSamples(root, number, type, core) {
    return root.bulk_create_samples.create({
      state:                 "draft",
      quantity:              number,
      sample_type:           type,
      sanger_sample_id_core: core
    }).then(function(action) {
      return action.result.samples;
    }, function() {
      return "Could not pre-register " + nbOfSample + " samples in S2.";
    });
  }
  function preRegisterBarcodes(root, number, model, type) {
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

  // These two functions can be run in parallel
  function generateManifest(type, template, sampleBarcodes) {
    return sendManifestRequest(
      template,
      generateCSVBlob(sampleBarcodes, type)
    );
  }
  function createLabelledTubes(model, root, labwareModel, aliquotType) {
    // Creates tubes in the system that hold each of the samples, and then labels those tubes
    // with the barcode that was attached to the sample the tube contains.
    var builder = function(raw) {
      return root[labwareModel.pluralize()].instantiate(_.build('rawJson', labwareModel, raw));
    };

    var tubes =
      _.chain(model.sampleBarcodes)
       .values()
       .map(_.first)
       .map(_.partial(createAliquotForSample, aliquotType))
       .value();

    return root["bulk_create_" + labwareModel.pluralize()].create({
      tubes: tubes
    }).then(function (bulkCreationLabwareObject) {
      model.labwareOutputs =
        _.chain(bulkCreationLabwareObject.result[labwareModel.pluralize()])
         .map(builder)
         .map(_.partial(bindBarcodeToTube, model.sampleBarcodes))
         .value();

      return root.bulk_create_labellables.create({
        labellables: _.map(model.labwareOutputs, labellableForResource)
      }).fail(function() {
        return "Couldn't connect the tubes to their labels in S2.";
      });
    }, function() {
      return "Couldn't register the associated piece of labware."
    });
  }

  function bindBarcodeToTube(sampleBarcodes, tube) {
    tube.labels = sampleBarcodes[tube.aliquots[0].sample.uuid][1];
    return tube;
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

  function createAliquotForSample(type, sample) {
    return {
      aliquots:[{
        "sample_uuid": sample.uuid,
        "type": type
      }]
    };
  }

  function generateCSVBlob(sampleBarcodes, type){
    var csv =
      _.chain(sampleBarcodes)
       .values()
       .map(_.partial(csvRow, type))
       .unshift([["Tube Barcode", "Sanger Barcode", "Sanger Sample ID", "SAMPLE TYPE"]])
       .map(function(row) { return row.join(","); })
       .value()
       .join("\n");

    return new Blob([csv], { "type" : "text\/csv" })
  }
  function csvRow(type, pair) {
   var sample = pair[0], label = pair[1];
   return [
     label.ean13,
     label.sanger.prefix + label.sanger.number + label.sanger.suffix,
     sample.sanger_sample_id,
     type
   ];
  }

  // TODO: Use jQuery because this is fugly
  function sendManifestRequest(templateBlob,manifestBlob) {
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
  }
});
