define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
  , 'extraction_pipeline/lib/csv_parser'
  , 'extraction_pipeline/lib/json_templater'
], function (BasePageModel, Operations, CSVParser, JsonTemplater) {
  'use strict';

  var ReceptionModel = Object.create(BasePageModel);

  $.extend(ReceptionModel, {

    init: function (owner, config) {
      this.owner = owner;
      this.inputRacks = []; //$.Deferred();
      this.config = config;
      this.isReady = false;
      this.nbOfRows = 8;
      this.nbOfColumns = 12;
      this.purpose = "Stock";
      this.outputModelType = "tube_rack";
      this.outputCapacity = this.nbOfRows * this.nbOfColumns;
      this.initialiseCaching();
      return $.Deferred().resolve(this).promise();
    },

    reset: function () {
      delete this.inputRacks;
      delete this.contentType;
      delete this.isReady;
      delete this.outputRack;
    },

    addRack: function (rackBarcode) {
      var deferred = $.Deferred();
      var thisModel = this;
      thisModel.inputRacks = thisModel.inputRacks || [];
      if (_.find(thisModel.inputRacks, function (rack) {
        return rack.labels.barcode.value === rackBarcode;
      })) {
        deferred.reject({message: "already there"})
      } else {
        if (!thisModel.contentType) {
          thisModel.nbOfTubesToRerack = 0;
        }
        this.cache.fetchResourcePromiseFromBarcode(rackBarcode, "tube_racks")
            .fail(function () {
              deferred.reject("Couldn't find the rack!");
            })
            .then(function (resource) {
              var contentTypesInNewRack = _.chain(resource.tubes).pluck('aliquots').flatten().pluck('type').groupBy().keys().value();
              if (contentTypesInNewRack.length > 1) {
                // is the rack homogeneous (sanity check) ?
                var msg = "The content of the rack is not homogenous! It contains " + contentTypesInNewRack.join(" & ")
                    + " aliquots! Please check the rack content!";
                deferred.reject({message: msg });
              } else if (thisModel.contentType && thisModel.contentType !== contentTypesInNewRack[0]) {
                // is the content of the new rack the same than the rack already there ?
                deferred.reject({message: "The content of the rack (" + contentTypesInNewRack[0] + ") is not compatible with the previous racks (" + thisModel.contentType + ")!"})
              } else if (thisModel.nbOfTubesToRerack + _.size(resource.tubes) >= thisModel.outputCapacity) {
                // will there be enough space on the output rack ?
                deferred.reject({message: "It is not possible to rerack all this racks together, as there will be more than " + thisModel.outputCapacity + " tubes on the output rack!"})
              }
              else {
                thisModel.contentType = contentTypesInNewRack[0];
                thisModel.inputRacks.push(resource);
                thisModel.nbOfTubesToRerack += _.size(resource.tubes);
                console.log(thisModel.nbOfTubesToRerack);
                if (thisModel.inputRacks.length > 1) {
                  thisModel.isReady = true;
                }
                deferred.resolve(thisModel);
              }
            });
      }

      return deferred.promise();

//      function setupInputs(that) {
//        var inputs = [];
//        return that.batch.items
//            .then(function (items) {
//              return $.when.apply(null,
//                  _.chain(items)
//                      .filter(function (item) {
//                        return item.role === that.config.input.role && item.status === 'done';
//                      })
//                      .map(function (item) {
//                        return that.cache.fetchResourcePromiseFromUUID(item.uuid)
//                            .then(function (resource) {
//                              inputs.push(resource);
//                            });
//                      })
//                      .value());
//            })
//            .then(function () {
//              return that.inputs.resolve(inputs);
//            })
//            .fail(that.inputs.reject);
//      }

    },

    setFileContent: function (csvAsTxt) {
      var deferred = $.Deferred();
      var locationsSortedByBarcode = CSVParser.convertCSVDataToJSON(csvAsTxt);
      var model = this;
      var root;
      model.owner.getS2Root()
          .fail(function (error) {
            deferred.reject({message: "impossible to get the roo!"});
          })
          .then(function (result) {
            root = result;
            return getTubesOnRack(model, locationsSortedByBarcode);
          })
          .fail(function (error) {
            deferred.reject({message: error.message});
          })
          .then(function (inputs) {
            var tube_rack = root.tube_racks.new();
            tube_rack.tubes = _.chain(inputs).reduce(function (memo, tube) {
              memo[locationsSortedByBarcode[tube.labels.barcode.value]] = tube.uuid;
              return memo;
            }, {}).value();
            model.outputRack = tube_rack;
            deferred.resolve(model);
          });
      return deferred.promise();

      function getTubesOnRack(model, locationsSortedByBarcode) {
        var tubeUUIDs = _.chain(model.inputRacks)
            .pluck("tubes")
            .map(function(tubeSet){
              return _.pluck(tubeSet, "uuid") ;
            }).flatten().value();
        var inputBarcodes = _.keys(locationsSortedByBarcode);
        var searchDeferred = $.Deferred();
        model.owner.getS2Root()
            .then(function (root) {
              return root.tubes.findBy2DBarcode(inputBarcodes, true);
            })
            .fail(function () {
              return searchDeferred.reject({message: "Couldn't search for the tubes in the rack!"});
            })
            .then(function (inputTubes) {
              if (inputTubes.length === 0) {
                return searchDeferred.reject({message: "There are no tubes in this rack!"});
              }
              if (inputTubes.length !== inputBarcodes.length) {
                return searchDeferred.reject({message: "The tubes were not all found!"});
              }
              if (_.some(inputTubes, function (tube) {
                return tube.resourceType !== inputTubes[0].resourceType;
              })) {
                return searchDeferred.reject({message: "The tubes are not all of the same type"});
              }
              if (_.some(inputTubes, function (tube){
                return ! _.contains(tubeUUIDs,tube.uuid);
              })) {
                return searchDeferred.reject({message: "Some tubes in the this rack were not present in the source racks!"});
              }

              return searchDeferred.resolve(inputTubes);
            });
        return searchDeferred.promise();
      }
    },

    rerack: function () {
      var deferred = $.Deferred();
      var thisModel = this;
//      thisModel.getXLSTemplate(templateName)
//          .fail(function(error){
//            return deferred.reject({message:"Couldn't load the specified template: "+templateName, previous_error:error});
//          })
//          .then(function(templateBlob){
//            thisModel.currentTemplateBlob = templateBlob;
//            return thisModel.getLabellables(templateName, study, sampleType, nbOfSample);
//          })
//          .fail(function(error){
//            return deferred.reject({message: " Couldn't produce the samples. " + error.message, previous_error: error});
//          })
//          .then(function () {
//            return thisModel.generateCSVBlob(sampleType);
//          })
//          .fail(function (error) {
//            return deferred.reject({message: " Couldn't produce barcode data file. " + error.message, previous_error: error});
//          })
//          .then(function (manifestCsvBlob) {
//            thisModel.manifestCsvBlob = manifestCsvBlob;
//            // now we are ready...
//            return thisModel.sendManifestRequest(thisModel.currentTemplateBlob, thisModel.manifestCsvBlob);
//          })
//          .fail(function(error){
      return deferred.reject({message: " not implemented yet "});
//          })
//          .then(function(){
//            return deferred.resolve();
//          });
      return deferred.promise();
    },

    getLabellables: function (templateName, studyName, sampleType, nbOfSample) {
      var deferred = $.Deferred();
//      var thisModel = this;
//      var root;
//      var labwareModel = ReceptionTemplates[templateName].model;
//      var sangerSampleIdCore = ReceptionStudies[studyName].sanger_sample_id_core;
//      thisModel.owner.getS2Root()
//          .fail(function () {
//            return deferred.reject({message: "Couldn't get the root! Is the server accessible?"});
//          })
//          .then(function (result) {
//            root = result;
//            // creation of the samples
//            return root.bulk_create_samples.create({
//              state:     "draft",
//              quantity:  nbOfSample,
//              sample_type: sampleType,
//              sanger_sample_id_core:sangerSampleIdCore
//            });
//          })
//          .fail(function () {
//            return deferred.reject({message: "Couldn't create the empty samples on S2."});
//          })
//          .then(function (bulkCreationSampleObject) {
//            // might be useful to instantiate the samples at some point....
//            // For now, we just use them as bare objects
//            thisModel.samples = bulkCreationSampleObject.result.samples;
//            var tubes = _.map(thisModel.samples, function (sample) {
//              return {
//                aliquots:[{
//                  "sample_uuid": sample.uuid,
//                  "type": ReceptionTemplates[templateName].aliquot_type
//                }
//                ]
//              };
//            });
//            // creation of the piece of labware
//            return root["bulk_create_" + labwareModel.pluralize()].create({"tubes": tubes});
//          })
//          .fail(function () {
//            return deferred.reject({message: "Couldn't register the associated piece of labware."});
//          })
//          .then(function (bulkCreationLabwareObject) {
//            thisModel.labwareOutputs = _.map(bulkCreationLabwareObject.result.tubes, function (rawTube) {
//              return root.tubes.instantiate({rawJson:{tube:rawTube}});
//            });
//            // creation of the barcodes
//            return root.bulk_create_barcodes.create({
//              "number_of_barcodes": nbOfSample,
//              "labware":  labwareModel,
//              "role":     "stock",
//              "contents": sampleType
//            });
//          })
//          .fail(function () {
//            return deferred.reject({message: "Couldn't create the barcodes."});
//          })
//          .then(function (bulkCreationBarcodeObject) {
//            thisModel.barcodes = bulkCreationBarcodeObject.result.barcodes;
//            var labels = _.map(thisModel.barcodes, function (label) {
//              return {
//                barcode:        {
//                  type:  "ean13-barcode",
//                  value: label.ean13
//                },
//                "sanger label": {
//                  type:  "sanger-barcode",
//                  value: label.sanger.prefix + label.sanger.number + label.sanger.suffix
//                }
//              };
//            });
//            var bulkData = _.map(thisModel.labwareOutputs, function (labware) {
//              // NOTE: in theory, one can associate a labware to any barcode.
//              // However, in the test data, because the tests nmight a bit too strict
//              // this order can become relevant... Be careful when running tests.
//              return {"name": labware.uuid, "type": "resource", labels:labels.pop()};
//            });
//            // link barcodes to labware
//            return root.bulk_create_labellables.create({
//              labellables:   bulkData
//            });
//          })
//          .fail(function () {
//            return deferred.reject({message: "Couldn't associate the barcodes to the tubes."});
//          })
//          .then(function (bulkCreationLabellableObject) {
//            _.each(thisModel.labwareOutputs, function (output) {
//              var matchingLabellable = _.chain(bulkCreationLabellableObject.result.labellables).find(function (labellable) {
//                return labellable.name === output.uuid;
//              }).value();
//              output.labels = matchingLabellable.labels;
//            });
//            deferred.resolve(thisModel.labwareOutputs);
//          });

      return deferred.promise();
    },

    createOutputsAndPrint: function (printerName) {
      var model = this;
      var root;
      return model.owner.getS2Root()
          .then(function (result) {
        root = result;

        return root.barcodes.create({
          labware:  model.outputModelType.singularize(),
          contents: model.contentType,
          role:     model.purpose
        });
          })
          .then(function(barcode){
            model.barcodeForOuputRack = barcode;
            debugger;
            var dummy_rack = {
              returnPrintDetails:function() {
                var label = {
                  template: model.outputModelType.singularize()
                };

                label[model.outputModelType.singularize()] = {
                  ean13:      model.barcodeForOuputRack.ean13,
                  sanger:     model.barcodeForOuputRack.sanger,
                  label_text: model.purpose
                };

                return label;
              }
            };
            return model.printBarcodes([dummy_rack], printerName);
          });

//        return Operations.registerLabware(
//            root['tube_racks'],
//            model.contentType,
//            model.purpose,
//            {
//              number_of_rows:    model.nbOfRows,
//              number_of_columns: model.nbOfColumns
////              tubes:             model.preparedTransferData
//            });
//      }).then(function (state) {
//            model.cache.push(state.labware);
//            model.owner.childDone(model, 'outputsReady', {});
//            return state.labware;
//          }).then(function (rack) {
//            return rack;
//          }).fail(function () {
//            $('body').trigger('s2.status.error', "Impossible to create the rack.");
//          });
    }


  });

  return ReceptionModel;
});
