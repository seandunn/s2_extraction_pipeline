define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
  , 'extraction_pipeline/lib/csv_parser'
], function (BasePageModel, Operations, CSVParser) {
  'use strict';

  var ReceptionModel = Object.create(BasePageModel);

  $.extend(ReceptionModel, {

    init: function (owner, config) {
      this.owner = owner;
      this.inputs = $.Deferred();
      this.output = [];
      this.config = config;
      this.isReady = false;

      // this.initialiseCaching(); // not used
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
            oReq.open("GET", '/xls_templates/manifest.xlsx', true);
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
            deferred.resolve(blob);
          });
          // end of TODO
        };
        var form = new FormData();
        form.append("template",templateBlob);
        form.append("barcodes",manifestCsv);

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
    }
  });

  function getLastPositions(positions) {
    return _.chain(positions)
        .map(function (position) {
          // convert A1 -> A01
          var matches = /([a-zA-Z])(\d+)/.exec(position);
          return  [ matches[1] + ("00" + matches[2]).slice(-2), matches[1], parseInt(matches[2]) ];
        })
        .sortBy(function (trio) {
          return trio[0];
        })
        .last()
        .value();
  }

  function getNextToLastPosition(lastElement) {
    var nextElement;
    if (lastElement[2] < 12) {
      nextElement = lastElement[1] + (lastElement[2] + 1)
    } else {
      nextElement = String.fromCharCode((lastElement[1].charCodeAt(0) + 1)) + "1";
    }
    return nextElement;
  }

  function checkFileValidity(model, locationVolumeData) {
    var deferred = $.Deferred();

    model.inputs.then(function (inputs) {
      var arrayOfRackLocations = _.map(locationVolumeData.array, function (volItem) {
        return volItem[0];
      });
      var expectedNbOfTubes = _.keys(inputs[0].tubes).length;
      var nbOfTubesInRack = arrayOfRackLocations.length;

      if (nbOfTubesInRack !== expectedNbOfTubes) {
        deferred.reject({message: "The number of tube is not correct. The current batch" +
                                      " contains " + expectedNbOfTubes + " tubes, while the " +
                                      "current volume file contains " + nbOfTubesInRack + " tubes!"});
      }
      deferred.resolve(model);
    });
    return deferred.promise();
  }

  function getInputResources(model, filteringFunc) {
    var inputs = [];
    var deferred = $.Deferred();
    filteringFunc = filteringFunc || function (item) {
      return item.role === model.config.input.role && item.status === 'done';
    };
    model.batch.items
        .then(function (items) {
          return $.when.apply(null,
              _.chain(items)
                // filter the item which are not relevant
                  .filter(filteringFunc)
                  .map(function (item) {
                    return model.cache.fetchResourcePromiseFromUUID(item.uuid)
                        .then(function (resource) {
                          inputs.push(resource);
                        });
                  })
                  .value());
        })
        .fail(function (error) {
          // TODO: the error reported here is not an error message yet, but the failed promise itself.
          // therefore, we do not cannot encapsulate it yet.
          deferred.reject({message: "Could not get the input resources ", previous_error: null});
        })
        .then(function () {
          return deferred.resolve(inputs);
        });
    return deferred.promise();
  }

  return ReceptionModel;
});

