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
            return thisModel.getBarcodes(template, nbOfSample);
          })
          .fail(function(error){
            return deferred.reject({message:" Couldn't produce barcode data file "+error.message, previous_error:error});
          })
          .then(function(manifestCsv){
            thisModel.manifestCsv = manifestCsv;
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


    getBarcodes:function(template,nbOfSample){
      var deferred = $.Deferred();
      var labwareModel = this.config[template].model;

      deferred.resolve();
      return deferred.promise();
    },

    createOutputs: function(printer) {
      var deferred = $.Deferred();
      var thisModel = this;
//      this.behaviours.outputs.print(function() {
//        var root;

        thisModel.owner.getS2Root()
            .then(function (result) {
              return result;
            })
            .fail(function(error){
              return deferred.reject({message:"Couldn't get the Root!"});
            })
            .then(function(root) {


              thisModel.printBarcodes(collection, printerName);
//              thisModel.inputs.then(function(inputs) {
//                var labware = [];
//                var promises = _.chain(inputs).map(function(input) {
//                  return _.chain(that.config.output).pairs().filter(function(outputNameAndDetails) {
//                    var details = outputNameAndDetails[1];
//                    return details.tracked === undefined ? true : details.tracked;
//                  }).map(function(outputNameAndDetails) {
//                        var details = outputNameAndDetails[1];
//                        return Operations.registerLabware(
//                            root[details.model],
//                            details.aliquotType,
//                            details.purpose
//                        ).then(function(state) {
//                              that.cache.push(state.labware);
//                              labware.push(state.labware);
//                              return state.labware;
//                            }).fail(function() {
//                              that.owner.childDone(that, "failed", {});
//                            });
//                      }).value();
//                }).flatten().value();

//                $.when.apply(null, promises).then(function() {
//                  that.outputs.resolve(labware).then(function(outputs) {
//                    that.printBarcodes(outputs, printer);
//                  });
//                  that.owner.childDone(that, 'outputsReady', {});
//                }).fail(function() {
//                      that.owner.childDone(that, 'failed', {});
//                    });
//              });
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
          deferred.reject({message: 'Something went wrong...' + oEvent.target.responseText});
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




//    setupModel: function (setupData) {
//      this.cache.push(setupData.batch);
//      this.user = setupData.user;
//      this.batch = setupData.batch;
//      var thisModel = this;
//      var deferred = $.Deferred();
//
//      getInputResources(thisModel)
//          .fail(function (error) {
//            deferred.reject( {message: error.message, previous_error: error});
//          })
//          .then(function (inputs) {
//            thisModel.inputs.resolve(inputs);
//            return deferred.resolve(thisModel);
//          });
//      return deferred.promise();
//    },

//    setControlSourceFromBarcode: function (barcode) {
//      var deferred = $.Deferred();
//      var thisModel = this;
//      this.cache
//          .fetchResourcePromiseFromBarcode(barcode)
//          .fail(function (error) {
//            // TODO: the error reported here is not an error message yet, but the failed promise itself.
//            // therefore, we do not cannot encapsulate it yet.
//            deferred.reject( {message: "Could not find the tube with barcode " + barcode, previous_error: null});
//          })
//          .then(function (rsc) {
//            thisModel.controlSource = rsc;
//            if (thisModel.rack_data) {
//              thisModel.isReady = true;
//            }
//            return deferred.resolve(thisModel);
//          });
//      return deferred.promise();
//    },

//    removeControlSource: function () {
//      delete this.controlSource;
//      this.isReady = false;
//      return $.Deferred().resolve(this).promise();
//    },

//    setRackContent: function (dataAsTxt) {
//      var thisModel = this;
//      var deferred = $.Deferred();
//      var locationVolumeData = CSVParser.volumeCsvToArray(dataAsTxt);
//
//      checkFileValidity(thisModel, locationVolumeData)
//          .fail(function (error) {
//            deferred.reject({message: error.message, previous_error: error});
//          })
//          .then(function (model) {
//            var rackData = {};
//            rackData.resourceType = thisModel.config.input.model.singularize();
//            rackData.tubes = {};
//
//            _.each(locationVolumeData.array, function (volumeItem) {
//              rackData.tubes[volumeItem[0]] = {volume: volumeItem[1]};
//            });
//
//            thisModel.rack_data = rackData;
//            if (thisModel.controlSource) {
//              thisModel.isReady = true;
//            }
//
//            deferred.resolve(thisModel);
//          });
//
//      return deferred.promise();
//    },

//    findVolumeControlPosition: function () {
//      var keys = _.keys(this.rack_data.tubes);
//      if (keys.length < 96) {
//        return this.volumeControlPosition = getNextToLastPosition(getLastPositions(keys));
//      } else {
//        return null;
//      }
//    },
//
//    addVolumeControlToRack: function () {
//      var deferred = $.Deferred();
//      var thisModel = this;
//      thisModel.createControlTube()
//          .fail(function (error) {
//            deferred.reject( {message: error.message, previousError: error});
//          }).then(function (controlTube) {
//            thisModel.controlTube = controlTube;
//            thisModel.cache.push(controlTube);
//            var tubesLocation = {tubes: {}};
//            tubesLocation.tubes[thisModel.volumeControlPosition] = controlTube.uuid;
//            return thisModel.inputs
//                .fail(function () {
//                  deferred.reject( {message: "Couldn't get the input resources!!!"});
//                })
//                .then(function (inputs) {
//                  return inputs[0].update(tubesLocation);
//                })
//          })
//          .fail(function () {
//            deferred.reject( {message: "Couldn't add the new control tube."});
//          })
//          .then(function(){
//            return thisModel.updateRoles();
//          })
//          .fail(function (error) {
//            deferred.reject( {message: error.message, previous_error: error});
//          })
//          .then(function () {
//            deferred.resolve(thisModel);
//          });
//
//      return deferred.promise();
//    },
//
//    createControlTube: function () {
//      var deferred = $.Deferred();
//      var thisModel = this;
//      thisModel.owner.getS2Root()
//          .then(function (root) {
//            var attributes = {
//              "aliquots": [
//                {
//                  "sample_uuid": thisModel.controlSource.uuid,
//                  "type":        "NA",
//                  "quantity":    5
//                }
//              ]
//            };
//            return root[thisModel.config.output[1].model].create(attributes);
//          })
//          .fail(function () {
//            deferred.reject({message: "Couldn't register the new control tube."});
//          })
//          .then(function (controlTube) {
//            deferred.resolve(controlTube);
//          });
//      return deferred.promise();
//    },
//
//    updateRoles: function () {
//      var deferred = $.Deferred();
//
//      var thisModel = this;
//
//      function makeJSONUpdateFor(role, uuid, event) {
//        var updateJson = { items: {} };
//        updateJson.items[role] = {};
//        updateJson.items[role][uuid] = {
//          event: event
//        };
//        return updateJson;
//      }
//
//      thisModel.inputs
//          .fail(function (error) {
//            deferred.reject( {message: "Couldn't get the input items!!"});
//          })
//          .then(function (inputs) {
//            var rack = inputs[0];
//            return inputs[0].order()
//                .then(function (order) {
//                  return order.update(makeJSONUpdateFor(thisModel.config.input.role, rack.uuid, "unuse"))
//                })
//                .then(function (order) {
//                  return order.update(makeJSONUpdateFor(thisModel.config.output[0].role, rack.uuid, "start"))
//                })
//                .then(function (order) {
//                  return order.update(makeJSONUpdateFor(thisModel.config.output[0].role, rack.uuid, "complete"))
//                })
//                .fail(function (error) {
//                  deferred.reject( {message: "Couldn't update the rack role"});
//                })
//                .then(function () {
//                  deferred.resolve(thisModel);
//                });
//          });
//
//      return deferred.promise();
//    }

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

