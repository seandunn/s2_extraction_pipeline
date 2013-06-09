define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
  , 'extraction_pipeline/lib/csv_parser'
  , 'extraction_pipeline/lib/json_templater'
  , 'extraction_pipeline/lib/reception_templates'
], function (BasePageModel, Operations, CSVParser, JsonTemplater, ReceptionTemplate) {
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
      delete this.samples;
      delete this.labwareOutputs;
      delete this.barcodes;
    },

    generateSamples: function (templateName, nbOfSample) {
      var deferred = $.Deferred();
      var thisModel = this;
      thisModel.getXLSTemplate(templateName)
          .fail(function(error){
            return deferred.reject({message:"Couldn't load the specified template: "+templateName, previous_error:error});
          })
          .then(function(templateBlob){
            thisModel.currentTemplateBlob = templateBlob;
            return thisModel.getLabellables(templateName, nbOfSample);
          })
          .fail(function(error){
            return deferred.reject({message: " Couldn't produce the samples. " + error.message, previous_error: error});
          })
          .then(function (labellables) {
            return thisModel.generateCSVBlob(labellables);
          })
          .fail(function (error) {
            return deferred.reject({message: " Couldn't produce barcode data file. " + error.message, previous_error: error});
          })
          .then(function (manifestCsvBlob) {
            thisModel.manifestCsvBlob = manifestCsvBlob;
            // now we are ready...
            return thisModel.sendManifestRequest(thisModel.currentTemplateBlob, thisModel.manifestCsvBlob);
          })
          .fail(function(error){
            return deferred.reject({message:" >> "+error.message, previous_error:error});
          })
          .then(function(){
            return deferred.resolve();
          });
      return deferred.promise();
    },

    getXLSTemplate: function (templateName, nbOfSample) {
      var deferred = $.Deferred();
      var oReq = new XMLHttpRequest();
      oReq.open("GET", ReceptionTemplate[templateName].manifest_path, true);
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

    getLabellables: function (templateName, nbOfSample) {
      var deferred = $.Deferred();
      var thisModel = this;
      var root;
      var labwareModel = ReceptionTemplate[templateName].model;
      var sampleType = ReceptionTemplate[templateName].sample_type;
      thisModel.owner.getS2Root()
          .fail(function () {
            return deferred.reject({message: "Couldn't get the root! Is the server accessible?"});
          })
          .then(function (result) {
            root = result;
            // creation of the samples
            return root.bulk_create_samples.create({
              state:     "draft",
              quantity:  nbOfSample,
              sample_type: sampleType
            });
          })
          .fail(function () {
            return deferred.reject({message: "Couldn't create the empty samples on S2."});
          })
          .then(function (bulkCreationSampleObject) {
            // might be useful to instantiate the samples at some point....
            // For now, we just use them as bare objects
            thisModel.samples = bulkCreationSampleObject.result.samples;
            var tubes = _.map(thisModel.samples, function (sample) {
              return {
                aliquots:[{
                  "sample_uuid": sample.uuid,
                  "type": ReceptionTemplate[templateName].aliquot_type
                }
                ]
              };
            });
            // creation of the piece of labware
            return root["bulk_create_" + labwareModel.pluralize()].create({"tubes": tubes});
          })
          .fail(function () {
            return deferred.reject({message: "Couldn't register the associated piece of labware."});
          })
          .then(function (bulkCreationLabwareObject) {
            thisModel.labwareOutputs = _.map(bulkCreationLabwareObject.result.tubes, function (rawTube) {
              return root.tubes.instantiate({rawJson:{tube:rawTube}});
            });
            // creation of the barcodes
            return root.bulk_create_barcodes.create({
              "number_of_barcodes": nbOfSample,
              "labware":  labwareModel,
              "role":     "stock",
              "contents": sampleType
            });
          })
          .fail(function () {
            return deferred.reject({message: "Couldn't create the barcodes."});
          })
          .then(function (bulkCreationBarcodeObject) {
            thisModel.barcodes = bulkCreationBarcodeObject.result.barcodes;
            var labels = _.map(thisModel.barcodes, function (label) {
              return {
                barcode:        {
                  type:  "ean13-barcode",
                  value: label.barcode.ean13
                },
                "sanger label": {
                  type:  "sanger-barcode",
                  value: label.barcode.sanger.prefix + label.barcode.sanger.number + label.barcode.sanger.suffix
                }
              };
            });
            var bulkData = _.map(thisModel.labwareOutputs, function (labware) {
              // NOTE: in theory, one can associate a labware to any barcode.
              // However, in the test data, because the tests nmight a bit too strict
              // this order can become relevant... Be careful when running tests.
              return {"name": labware.uuid, "type": "resource", labels:labels.pop()};
            });
            // link barcodes to labware
            return root.bulk_create_labellables.create({
              labellables:   bulkData
            });
          })
          .fail(function () {
            return deferred.reject({message: "Couldn't associate the barcodes to the tubes."});
          })
          .then(function (bulkCreationLabellableObject) {
            _.each(thisModel.labwareOutputs, function (output) {
              output.labels = bulkCreationLabellableObject.result.labellables.pop().labels;
            });
            deferred.resolve(thisModel.labwareOutputs);
          });
      return deferred.promise();
    },

    generateCSVBlob: function(){
      var thisModel = this;
      var data = _.map(thisModel.labwareOutputs,function(labware){
        var sampleUUID = labware.aliquots[0].sample.uuid;
        var sanger_sample_id = _.find(thisModel.samples,function (sample) {
          return sample.uuid === sampleUUID;
        }).sanger_sample_id;
        return [labware.labels.barcode.value, sanger_sample_id ].join(',');
      });
      data.unshift("Tube Barcode,Sanger Sample ID");
      var txt = data.join("\n");
      return new Blob([txt], { "type" : "text\/csv" })
    },

    printBarcodes: function (printerName) {
      var deferred = $.Deferred();
      var thisModel = this;
      BasePageModel.printBarcodes(thisModel.labwareOutputs, printerName)
          .fail(function(){
            return deferred.reject({message: "Couldn't print the barcodes."});
          })
          .then(function(){
            return deferred.resolve(thisModel);
          });
      return deferred.promise();
    },

    sendManifestRequest: function (templateBlob,manifestBlob) {
      var deferred = $.Deferred();
      var thisModel = this;
      try {
        var xhr = new XMLHttpRequest;
        xhr.open("POST", 'http://psd2g.internal.sanger.ac.uk:8100/manifest-merge-service/');
        xhr.responseType = "blob";
        xhr.onerror = function (oEvent) {
          deferred.reject({
            message: "Unable to send the manifest... Is the XLS merger server up and running? "
          });
        };
        xhr.onload = function (oEvent) {
          thisModel.manifestBlob = this.response;
          deferred.resolve(thisModel);
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
        deferred.reject({message: message});
      }
      return deferred.promise();
    }
  });

  return ReceptionModel;
});
