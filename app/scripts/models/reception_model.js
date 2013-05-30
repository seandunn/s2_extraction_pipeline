define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
  , 'extraction_pipeline/lib/csv_parser'
  , 'extraction_pipeline/lib/array_to_json'
], function (BasePageModel, Operations, CSVParser, ArrayToJSON) {
  'use strict';

  var ReceptionModel = Object.create(BasePageModel);

  $.extend(ReceptionModel, {

    init: function (owner, config) {
      this.owner = owner;
      this.inputs = $.Deferred();
      this.config = config;
      return $.Deferred().resolve(this).promise();
    },

    generateSamples: function (template, nbOfSample) {
      var deferred = $.Deferred();
      var thisModel = this;
      thisModel.getXLSTemplate(template)
          .fail(function(error){
            return deferred.reject({message:"Couldn't load the specified template: "+template, previous_error:error});
          })
          .then(function(templateBlob){
            thisModel.currentTemplate = templateBlob;
            return thisModel.getLabellables(template, nbOfSample);
          })
          .fail(function(error){
            return deferred.reject({message: " Couldn't produce the samples. " + error.message, previous_error: error});
          })
          .then(function (labellables) {
            return thisModel.generateCSV(labellables);
          })
          .fail(function (error) {
            return deferred.reject({message: " Couldn't produce barcode data file. " + error.message, previous_error: error});
          })
          .then(function (manifestCsvAsTxt) {
            thisModel.manifestCsv = manifestCsvAsTxt;
            // now we are ready...
            return thisModel.sendManifestRequest(thisModel.currentTemplate, thisModel.manifestCsv);
          })
          .fail(function(error){
            return deferred.reject({message:" >> "+error.message, previous_error:error});
          })
          .then(function(){
            return deferred.resolve();
          });
      return deferred.promise();
    },

    getXLSTemplate: function (template, nbOfSample) {
      var deferred = $.Deferred();
      var oReq = new XMLHttpRequest();
      oReq.open("GET", '/xls_templates/' + this.config[template].URI, true);
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

    getLabellables: function (template, nbOfSample) {
      var deferred = $.Deferred();
      var thisModel = this;
      var root;
      var labwareModel = thisModel.config[template].model;
      var sampleType = thisModel.config[template].sample_type;
      thisModel.owner.getS2Root()
          .then(function (result) {
            root = result;
            // creation of the samples
            return root.bulk_create_sample.create({
              "quantity":  nbOfSample,
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
            var sample_uuids = _.map(thisModel.samples, function (sample) {
              return {"uuid": sample.uuid, "sample_type": sample.sample_type};
            });
            // creation of the piece of labware
            return root["bulk_create_" + labwareModel].create({"samples": sample_uuids});
          })
          .fail(function () {
            return deferred.reject({message: "Couldn't register the associated piece of labware."});
          })
          .then(function (bulkCreationLabwareObject) {
            thisModel.outputs = _.map(bulkCreationLabwareObject.result.tubes, function (rawTube) {
              return root.tubes.instantiate({rawJson:{tube:rawTube}});
            });
            // creation of the barcodes
            return root.bulk_create_barcode.create({
              "quantity": nbOfSample,
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
                  value: label.ean13
                },
                "sanger label": {
                  type:  "sanger-barcode",
                  value: label.sanger.prefix + label.sanger.number + label.sanger.suffix
                }
              };
            });
            var bulkData = _.map(thisModel.outputs, function (labware) {
              // NOTE: in theory, one can associate a labware to any barcode.
              // However, in the test data, because the tests nmight a bit too strict
              // this order can become relevant... Be careful when running tests.
              return {"name": labware.uuid, labels:labels.pop()};
            });
            // link barcodes to labware
            return root.bulk_create_labellable.create({
              type:   "resource",
              names:   bulkData
            });
          })
          .fail(function () {
            return deferred.reject({message: "Couldn't associate the barcodes to the tubes."});
          })
          .then(function (bulkCreationLabellableObject) {
            _.each(thisModel.outputs, function (output) {
              output.labels = bulkCreationLabellableObject.result.labellables.pop().labels;
            });
            deferred.resolve(thisModel.outputs);
          });
      return deferred.promise();
    },

    generateCSV: function(labellables){
      var data = _.map(labellables,function(labellable){
        return [labellable.labels.barcode.value, labellable.uuid ].join(',');
      });
      data.unshift("Tube Barcode , Sanger Sample ID");
      return data.join("\n");
    },

    printBarcodes: function (printerName) {
      var deferred = $.Deferred();
      var thisModel = this;
      BasePageModel.printBarcodes(thisModel.outputs, printerName)
          .fail(function(){
            return deferred.reject({message: "Couldn't print the barcodes."});
          })
          .then(function(){
            return deferred.resolve(thisModel);
          });
      return deferred.promise();
    },

    sendManifestRequest: function (templateBlob,manifestCsv) {
      var deferred = $.Deferred();
      var thisModel = this;
      try {
        var xhr = new XMLHttpRequest;
        xhr.open("POST", 'http://localhost:8080/upload', false);
        xhr.setRequestHeader('Content-Type', 'multipart/form-data ; boundary=AaB03x');
        xhr.onerror = function (oEvent) {
          console.warn('statusText : ', oEvent.target.statusText);
          console.warn('responseType : ', oEvent.target.responseType);
          console.warn('responseText : ', oEvent.target.responseText);
          deferred.reject({message: "Unable to send the manifest... Is the server up and running ? "  + oEvent.target.responseText});
        };
        xhr.onload = function (oEvent) {
          // TODO: this part is simulating the reception of a file from the server...
          // Change this when the proper return value will be known...
          function tmpFunctionForFileDownload (callback) {
            var oReq = new XMLHttpRequest();
            oReq.open("GET", '/xls_templates/manifest.xls', true);
            oReq.responseType = "blob";
            oReq.onload = function(oEvent) {
              var blob = oReq.response;
              callback(blob);
            };
            oReq.onerror = function(oEvent) {
            };
            oReq.send();
          }
          tmpFunctionForFileDownload(function(blob){
            thisModel.manifestBlob = blob;
            deferred.resolve(thisModel);
          });
          // end of TODO
        };
        var form = new FormData();
        form.append("template",templateBlob);
        form.append("manifest-details",manifestCsv);
        xhr.send(form);
      }
      catch (err) {
        var message = " msg:" + err.message;
        message += "\n" + err.code;
        message += "\n" + err.name;
        message += "\n" + err.stack;
        deferred.reject({message: message});
      }
      return deferred.promise();
    },

    setFileContent:function(fileContent){
      var deferred = $.Deferred();
      var dataAsArray = CSVParser.manifestCsvToArray(fileContent);
      var columnHeaders = dataAsArray[11];
      var templateName = dataAsArray[2][0]; // A3
      var combinedData = ArrayToJSON.combineHeadersToData(columnHeaders, _.drop(dataAsArray, 12), "_WILL_BE_REPLACED_");
      if (!this.config[templateName]){
        deferred.reject({message: "Couldn't find the corresponding template!"});
      }
      else if (columnHeaders.length <=1 && columnHeaders[0]){
        deferred.reject({message: "The file contains no header !"});
      }
      else if (combinedData.length <= 0){
        deferred.reject({message: "The file contains no data !"});
      }
      else
      {
        var samples = ArrayToJSON.arrayToJSON(combinedData, this.config[templateName].json_template);
        if(ArrayToJSON.containsDecorator(samples, "_WILL_BE_REPLACED_")) {
          deferred.reject({message: "Data not compatible with the template!"});
        }
        else {
          this.samplesFromManifest = samples;
          deferred.resolve(this);
        }
      }
      return deferred.promise();
    },

    updateSamples:function(){
      var deferred = $.Deferred();
      var thisModel = this;
      thisModel.owner.getS2Root()
        .fail(function () {
          return deferred.reject({message: "Couldn't get the root!"});
        })
        .then(function(root){
//        return root.bulk_update_sample.create(thisModel.samplesFromManifest);
          return deferred.reject({message: "Update call on S2 not implemented yet."});
        })
        .fail(function () {
          return deferred.reject({message: "Couldn't update the samples on S2."});
        })
        .then(function(){
          return deferred.resolve(thisModel);
        });

      return deferred.promise();
    }
  });
  
  return ReceptionModel;
});

