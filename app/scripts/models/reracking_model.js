define([
  "models/base_page_model"
  , "mapper/operations"
  , "lib/file_handling/racking"
  , "lib/json_templater"
], function (BasePageModel, Operations, CSVParser, JsonTemplater) {
  "use strict";

  var ReceptionModel = Object.create(BasePageModel);

  $.extend(ReceptionModel, {

    init: function (owner, config) {
      this.owner = owner;
      this.inputRacks = [];
      this.config = config;
      this.isReady = false;
      this.nbOfRows = 8;
      this.nbOfColumns = 12;
      this.purpose = "stock";
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
      var resource;
      thisModel.inputRacks = thisModel.inputRacks || [];
      if (_.find(thisModel.inputRacks, function (rack) {
        return rack.labels.barcode.value === rackBarcode;
      })) {
        deferred.reject({message: "already there"});
      } else {
        if (!thisModel.contentType) {
          thisModel.nbOfTubesToRerack = 0;
        }
        this.cache.fetchResourcePromiseFromBarcode(rackBarcode, "tube_racks")
        .fail(function () {
          deferred.reject({message:"Couldn't find the rack!"});
        })
        .then(function (result) {
          resource = result;
          return resource.order();
        })
        .then(function (order) {
          var rackHasActiveRole = _.some(order.items,function(roles){
            return _.chain(roles)
            .filter(function(item){return item.status==="done";})
            .pluck("uuid")
            .contains(resource.uuid)
            .value();
          });
          var contentTypesInNewRack = _.chain(resource.tubes).pluck("aliquots").flatten().pluck("type").groupBy().keys().value();
          if (contentTypesInNewRack.length > 1) {
            // is the rack homogeneous (sanity check) ?
            var msg = "The content of the rack is not homogenous! It contains " +
              contentTypesInNewRack.join(" & ") +
              " aliquots! Please check the rack content!";
            deferred.reject({message: msg });
          } else if (thisModel.contentType && thisModel.contentType !== contentTypesInNewRack[0]) {
            // is the content of the new rack the same than the rack already there ?
            deferred.reject({message: "The content of the rack (" + contentTypesInNewRack[0] + ") is not compatible with the previous racks (" + thisModel.contentType + ")!"});
          } else if (thisModel.nbOfTubesToRerack + _.size(resource.tubes) >= thisModel.outputCapacity) {
            // will there be enough space on the output rack ?
            deferred.reject({message: "It is not possible to rerack all this racks together, as there will be more than " + thisModel.outputCapacity + " tubes on the output rack!"});
          } else if (!rackHasActiveRole) {
            deferred.reject({message:"This rack is not in use anymore!!"});
          } else {
            thisModel.contentType = contentTypesInNewRack[0];
            thisModel.inputRacks.push(resource);
            thisModel.nbOfTubesToRerack += _.size(resource.tubes);
            if (thisModel.inputRacks.length > 1) {
              thisModel.isReady = true;
            }
            deferred.resolve(thisModel);
          }
        });
      }

      return deferred.promise();
    },

    setFileContent: function (csvAsTxt) {
      var deferred = $.Deferred();
      var locationsSortedByBarcode = CSVParser.from(csvAsTxt);
      var model = this;
      var root;
      model.owner.getS2Root()
      .fail(function (errorMessage) {
        deferred.reject({message: "Failed to load S2Root: " + errorMessage});
      })
      .then(function (result) {
        root = result;
        return getTubesOnRack(model, locationsSortedByBarcode);
      })
      .fail(function (error) {
        deferred.reject({message: error.message});
      })
      .then(function (inputs) {
        var tubeRack = root.tube_racks.new();
        tubeRack.tubes = _.chain(inputs).reduce(function (memo, tube) {
          memo[locationsSortedByBarcode[tube.labels.barcode.value]] = tube.uuid;
          return memo;
        }, {}).value();
        model.outputRack = tubeRack;
        deferred.resolve(model);
      });
      return deferred.promise();

      function getTubesOnRack(model, locationsSortedByBarcode) {
        var tubeUUIDs = _.chain(model.inputRacks)
        .pluck("tubes")
        .map(function (tubeSet) {
          return _.pluck(tubeSet, "uuid");
        }).flatten().value();
        var inputBarcodes = _.keys(locationsSortedByBarcode);
        var searchDeferred = $.Deferred();
        model.owner.getS2Root()
        .fail(function () {
          deferred.reject({message: "Impossible to get the root!"});
        })
        .then(function (root) {
          return root.tubes.findByEan13Barcode(inputBarcodes, true);
        })
        .fail(function () {
          return searchDeferred.reject({message: "Couldn't find the tubes in the rack!"});
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
          if (_.some(inputTubes, function (tube) {
            return !_.contains(tubeUUIDs, tube.uuid);
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
      thisModel.registerNewRack()
          .fail(function (message) {
            return deferred.reject(message);
          })
          .then(function (newRack) {
            thisModel.outputRack = newRack;
            deferred.resolve(thisModel);
            return thisModel.updateRoleOnRacks();
          });
      return deferred.promise();
    },

    registerNewRack: function () {
      var deferred = $.Deferred();
      var thisModel = this;
      thisModel.owner.getS2Root()
      .fail(function () {
        deferred.reject({message: "Impossible to get the root!"});
      })
      .then(function (root) {
        return root.tube_racks.create({
          number_of_rows:    thisModel.nbOfRows,
          number_of_columns: thisModel.nbOfColumns,
          tubes:             thisModel.outputRack.tubes
        });
      })
      .fail(function () {
        return deferred.reject({message: "Couldn't register the new rack!"});
      })
      .then(function (rack) {
        // we use the barcode we created....
        return thisModel.barcodeForOuputRack.label(rack);
      })
      .fail(function () {
        return deferred.reject({message: "Couldn't label the new rack!"});
      })
      .then(function (rack) {
        deferred.resolve(rack);
      });
      return deferred.promise();
    },

    updateRoleOnRacks: function () {
      var deferred = $.Deferred();
      var thisModel = this;
      var root, ordersSortedByUUID = {};
      thisModel.owner.getS2Root()
      .fail(function () {
        deferred.reject({message: "Impossible to get the root!"});
      })
      .then(function (result) {
        root = result;
        // get the orders
        return $.when.apply(null, _.map(thisModel.inputRacks, function (inputRack) {
          return inputRack.order()
          .fail(function () {
            deferred.reject({
              message: "Couldn't load one of the orders! Contact the administrator of the system."
            });
          })
          .then(function (order) {
            ordersSortedByUUID[order.uuid] = order; // we save orders
          });
        }));
      })
      .fail(function () {
        deferred.reject({
          message: "Couldn't load the orders. Contact the administrator of the system."
        });
      })
      .then(function () {
        var rackUUIDs = _.pluck(thisModel.inputRacks, "uuid");
        return $.when.apply(null, _.map(ordersSortedByUUID, function (order) {

          // for each order
          // we prepare the updates
          var updateJsonPartOne = { items: {} }; // unuse the roles of input rack, and start the output role on output rack
          var updateJsonPartTwo = { items: {} }; // complete the role on output rack
          _.chain(order.items)
          .reduce(function (memo, items, role) {
            var validItem = _.filter(items, function (item) {
              return _.contains(rackUUIDs, item.uuid) && item.status === "done";
            });
            if (validItem.length > 0) {
              memo[role] = validItem;
            }
            return memo;
          }, {})
          .each(function (labwares, role) {
            updateJsonPartOne.items[role] = updateJsonPartOne.items[role] || {};
            updateJsonPartTwo.items[role] = updateJsonPartTwo.items[role] || {};
            _.each(labwares, function (labware) {
              updateJsonPartOne.items[role][labware.uuid] = { event: "unuse" };
            });
            updateJsonPartOne.items[role][thisModel.outputRack.uuid] = { event: "start" };
            updateJsonPartTwo.items[role][thisModel.outputRack.uuid] = { event: "complete" };
          }).value();
          // we make the two successive updates
          return order.update(updateJsonPartOne).
            fail(function () {
            deferred.reject({
              message: "Couldn't start the role on the output rack. Contact the administrators."
            });
          }).then(function (order) {
            return order.update(updateJsonPartTwo);
          }).fail(function () {
            deferred.reject({
              message: "Couldn't complete the role on the output rack! Contact the administrator of the system."
            });
          });
        }));
      }).fail(function () {
        deferred.reject({
          message: "An error occured during the transfer process! Contact the administrator of the system."
        });
      }).then(function () {
        deferred.resolve(thisModel);
      });
      return deferred.promise();

    },

    printRackBarcode: function (printerName) {
      var thisModel = this;
      var root;
      // we create the barcode before we have a labware
      return thisModel.owner.getS2Root()
      .then(function (result) {
        root = result;
        return root.barcodes.create({
          labware:  thisModel.outputModelType.singularize(),
          contents: thisModel.contentType,
          role:     thisModel.purpose
        });
      })
      .then(function (barcode) {
        thisModel.barcodeForOuputRack = barcode;
        var dummyRack = {
          returnPrintDetails: function () {
            var label = {
              template: thisModel.outputModelType.singularize()
            };

            label[thisModel.outputModelType.singularize()] = {
              ean13:      thisModel.barcodeForOuputRack.ean13,
              sanger:     thisModel.barcodeForOuputRack.sanger.prefix +
                thisModel.barcodeForOuputRack.sanger.number +
                thisModel.barcodeForOuputRack.sanger.suffix,
              label_text: {
                role: thisModel.purpose + " " + thisModel.contentType
              }
            };
            return label;
          }
        };
        return thisModel.printBarcodes([dummyRack], printerName);
      });
    }


  });

  return ReceptionModel;
});
