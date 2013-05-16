define([
  'extraction_pipeline/models/base_page_model'
  , 'extraction_pipeline/lib/csv_parser'
], function (BasePageModel, CSVParser) {
  'use strict';

  function deferredHelper(callback) {
    var deferred = $.Deferred();
    return callback({
      resolve:       deferred.resolve,
      reject:        function (message) {
        return function (r) {
          deferred.reject(message);
        }
      },
      promise:       deferred.promise,
      state:         deferred.state,
      specialReject: function (message) {
        return function (r) {
          logFailure(message, r)();
          deferred.reject(message);
        }
      }

    });
  }

  function reject(deferred, error) {
    console.warn("Error : ", error.message);
    deferred.reject(error);
  }

  var VolumeControlModel = Object.create(BasePageModel);

  $.extend(VolumeControlModel, {

    init: function (owner, config) {
      this.owner = owner;
      this.config = config;
      this.input = $.Deferred();
      this.output = [];
      this.isReady = false;

      this.initialiseCaching();
      return $.Deferred().resolve(this).promise();
    },

    setupModel: function (setupData) {
      this.cache.push(setupData.batch);
      this.user = setupData.user;
      this.batch = setupData.batch;
      var thisModel = this;
      var deferred = $.Deferred();

      getInputResources(thisModel)
          .fail(function (error) {
            reject(deferred, {message: error.message, previous_error: error});
          })
          .then(function (inputs) {
            thisModel.input.resolve(inputs);
            return deferred.resolve(thisModel);
          });
      return deferred.promise();
    },

    setControlSourceFromBarcode: function (barcode) {
      var deferred = $.Deferred();
      var thisModel = this;
      this.cache
          .fetchResourcePromiseFromBarcode(barcode)
          .fail(function (error) {
            // TODO: the error reported here is not an error message yet, but the failed promise itself.
            // therefore, we do not cannot encapsulate it yet.
            reject(deferred, {message: "Could not find the tube with barcode " + barcode, previous_error: null});
          })
          .then(function (rsc) {
            thisModel.controlSource = rsc;
            if (thisModel.rack_data) {
              thisModel.isReady = true;
            }
            return deferred.resolve(thisModel);
          });
      return deferred.promise();
    },

    removeControlSource:function(){
      delete this.controlSource;
      this.isReady = false;
      return $.Deferred().resolve(this).promise();
    },

    setRackContent: function (dataAsTxt) {
      var thisModel = this;
      var deferred = $.Deferred();
      var locationVolumeData = CSVParser.volumeCsvToArray(dataAsTxt);

      checkFileValidity(thisModel, locationVolumeData)
          .fail(function (error) {
            deferred.reject({message: error.message, previous_error: error});
          })
          .then(function (model) {
            var rackData = {};
            rackData.resourceType = thisModel.config.input.model.singularize();
            rackData.tubes = {};

            _.each(locationVolumeData.array, function (volumeItem) {
              rackData.tubes[volumeItem[0]] = {volume: volumeItem[1]};
            });

            thisModel.rack_data = rackData;
            if (thisModel.controlSource) {
              thisModel.isReady = true;
            }

            deferred.resolve(thisModel);
          });

      return deferred.promise();
    },

    getVolumeControlPosition: function () {
      var keys = _.keys(this.rack_data.tubes);
      if (keys.length < 96) {
        return getNextToLastPosition(getLastPositions(keys));
      } else {
        return null;
      }
    },

    addVolumeControlToRack:function(){
      var deferred = $.Deferred();



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

    model.input.then(function (inputs) {
      var arrayOfRackLocations = _.map(locationVolumeData.array, function (volItem) {
        return volItem[0];
      });
      var expectedNbOfTubes = _.keys(inputs[0].tubes).length;
      var nbOfTubesInRack = arrayOfRackLocations.length;

      if (nbOfTubesInRack !== expectedNbOfTubes) {
        reject(deferred, {message:  "The number of tube is not correct. The current batch" +
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
          reject(deferred, {message: "Could not get the input resources ", previous_error: null});
        })
        .then(function () {
          return deferred.resolve(inputs);
        });
    return deferred.promise();
  }

  return VolumeControlModel;
});

