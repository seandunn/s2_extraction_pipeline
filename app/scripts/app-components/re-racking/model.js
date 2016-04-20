//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  "models/base_page_model",
  "mapper/operations",
  "lib/file_handling/racking",
], function (BasePageModel, Operations, CSVParser) {
  "use strict";

  var ReRackingModel = Object.create(BasePageModel);

  $.extend(ReRackingModel, {

    init: function (owner, config) {
      this.owner           = owner;
      this.inputRacks      = [];
      this.config          = config;
      this.nbOfRows        = 8;
      this.nbOfColumns     = 12;
      this.purpose         = "stock";
      this.outputModelType = "tube_racks";
      this.outputCapacity  = this.nbOfRows * this.nbOfColumns;
      this.initialiseCaching();
      return this;
    },

    reset: function () {
      this.inputRacks = [];
      delete this.contentType;
      delete this.outputRack;
    },


    // Should lookup a rack resource and add it to the model.
    addRack: function (rackBarcode) {
      var deferred = $.Deferred();
      var thisModel = this;
      var rack;

      var isInRackList = _.find(thisModel.inputRacks, function (rack) {
        return rack.labels.barcode.value === rackBarcode;
      });

      if (isInRackList) {
        return $.Deferred()
        .reject({
          message: "Rack '"+rackBarcode+"' alraedy included in list."
        })
        .promise();
      }

      this.cache
      .fetchResourcePromiseFromBarcode(rackBarcode, "tube_racks")
      .then(function storeRack(returnedRack) {
        rack = returnedRack;
        // We should only check the orders of the tubes inside my rack
        return $.when.apply(this, rack.allOrdersFromTubes());
      }, function () {
        return deferred.reject({message:"Couldn't find the rack."});
      })

      .then(function validateHasOnlyOneRole(orders){
        var activeRolesPerOrder = _.chain(orders)
        .pluck("items")
        .map(function(ordItems) {
          return _.chain(ordItems)
          .values()
          .flatten()
          .where({uuid: rack.uuid, status: "done"})
          .pluck("role")
          .value();
        })
        .value();

        // This should be only be applied with the roles of the tubes it contains
        if (_.some(activeRolesPerOrder, function(roles) { return roles.length === 0; })) {
          return deferred.reject({
            message: "A rack that's in use must have an activated role in all it's orders."
          });
        }


        var activeRoles = _.chain(activeRolesPerOrder)
        .flatten()
        .uniq()
        .value();

        if (activeRoles.length !== 1){
          return deferred.reject({
            message: "A rack must have the same active role in all orders. Please contact administrator."
          });
        }

        thisModel.activeRole = activeRoles[0];

        return thisModel.activeRole;
      })

      .then(function validateRackContents(rackRole) {


        _.defaults(thisModel, {rackRole: rackRole});

        var contentTypesInNewRack = _
        .chain(rack.tubes)
        .pluck("aliquots")
        .flatten()
        .pluck("type")
        .groupBy()
        .keys()
        .value();

        // vvvvvvvvv----- Must clean this mess up!

        if (contentTypesInNewRack.length > 2) {
          // is the rack homogeneous (sanity check) ?
          // DNA + Solvent or RNA + Solvent
          var message = "The contents of the rack are not homogenous. It contains " +
            contentTypesInNewRack.join(" & ") +
            " aliquots. Please check the rack content.";
          deferred.reject({message: message});

        } else if (thisModel.contentType && thisModel.contentType !== contentTypesInNewRack[0]) {

          // is the content of the new rack the same than the rack already there ?
          deferred.reject({message: "The content of the rack: " + contentTypesInNewRack[0] + " is not compatible with the previous racks: " + thisModel.contentType + "."});
        } else if (_.isUndefined(rackRole)) {

          deferred.reject({message:"This rack is recorded as not in use. Please contact administrator."});
        } else if (thisModel.rackRole !== rackRole){
          deferred.reject({
            message: "This rack does not have the same order role as the other racks. Please contact administrator."
          });
        } else {

          thisModel.contentType = contentTypesInNewRack[0];
          thisModel.inputRacks.push(rack);

          deferred.resolve(thisModel);
        }
      });

      return deferred.promise();
    },

    validateRackLayout: function(csvAsTxt) {
      var deferred = new $.Deferred(),
          inputTubeBarcodes,
          targetsByBarcode;

      try {
        targetsByBarcode = CSVParser.from(csvAsTxt);
      } catch (e) {
        return deferred.reject("Could not read the rack layout file. Please re-check its contents");
      }

      inputTubeBarcodes = getTubeBarcodesFromRacks(this.inputRacks);

      if (_.difference(_.keys(targetsByBarcode), inputTubeBarcodes).length !== 0){
        return deferred.reject("Racking file contains a tube not in the input racks");
      }

      if (_.keys(targetsByBarcode).length > this.outputCapacity){
        deferred.reject("Re-racking file includes " +
          this.targetsByBarcode.length +
          " and the target rack has only " +
          this.outputCapacity + " slots available.");
      }

      return deferred.resolve(targetsByBarcode);
    },

    setupTubeTransfers: function (targetsByBarcode) {
      var thisModel = this;
      var tubeCountByRackUuid = tubeCountPerRack(this.inputRacks);

      this._ordersForMovedTubes = {};
      
      // This reduce produces source move JSON for all tubes potentially
      // all the tubes in the input racks.
      var sourceMoves = _.reduce(this.inputRacks, mapBarcodeToSource, {});
      
      this._ordersForMovedTubes = _.reduce(this.inputRacks, function(memo, rack) {
        _.each(_.keys(targetsByBarcode), function(targetTubeBarcode) {
          var tube = _.find(rack.tubes, function(tube) { 
            return (targetTubeBarcode === tube.labels.barcode.value);
          });
          if (_.isUndefined(tube)) {
            return memo;
          }
          // Saves the list of order promises that are going to be moved
          if (_.isUndefined(memo[rack.uuid])) {
            memo[rack.uuid]=[];
          }
          memo[rack.uuid] = memo[rack.uuid].concat(orderPromisesForTube(rack, tube));          
        });
        return memo;
      }, {});
      
      
      this.buildRackOrderRoleChanges(targetsByBarcode);
      
      this.tubeMoves = _.reduce(
        targetsByBarcode,
        function(memo, targetLocation, tubeBarcode){
          var move = sourceMoves[tubeBarcode];
          // These names are translated to JSON so need to be in snake_case.
          move.target_uuid     = thisModel.outputRack.uuid;
          move.target_location = targetLocation;

          memo.moves.push(move);
          return memo;
        }, { moves: [] });

      return this;
    },
    buildRackOrderRoleChanges: function(targetsByBarcode) {
      this._oUuidToTubes = {};
      this._oUuidToMovedTubes = {};
      this._emptyRacksByOrder = {};
      // Compares tubes moved with tubes in rack. If, for a particular order, both lists 
      // are equal, then the rack can be unused for that order (as all tubes of that order
      // will not be nomore inside the rack after the reracking)
      _.each(this.inputRacks, _.bind(function(rack) {
        // Orders for tubes has to be obtained by promise
        $.when.apply(this, _.map(rack.tubes, _.bind(function(tube) {
          if (_.isUndefined(tube)) {
            return;
          }
          return orderPromisesForTube(rack, tube).then(_.bind(function(orders) {
            // ... hope no one decided that a tube could be in more than one order
            var order = _.first(orders);
            // If th tube is going to be moved (targetsByBarcode)
            if (!_.isUndefined(targetsByBarcode[tube.labels.barcode.value])) {
              if (_.isUndefined(this._oUuidToMovedTubes[order.uuid])) {
                this._oUuidToMovedTubes[order.uuid]=[];
              }
              // List of tubes moved by orderUuid (oUuidToMovedTubes)
              this._oUuidToMovedTubes[order.uuid]= this._oUuidToMovedTubes[order.uuid].concat(tube);
            }
            // Any tube will be in this other list (oUuidToTubes)
            if (_.isUndefined(this._oUuidToTubes[order.uuid])) {
              this._oUuidToTubes[order.uuid]=[];
            }
            this._oUuidToTubes[order.uuid]= this._oUuidToTubes[order.uuid].concat(tube);            
          }, this));
          return this;
        }, this))).then(_.bind(function() {
          // When all orders has been obtained for all tubes in the rack (the list of moved tubes for
          // an order in a rack equals the list of tubes of the rack for that order
          _.each(_.pairs(this._oUuidToTubes), _.bind(function(pair) {
            var orderUuid= pair[0];
            var tubes = pair[1];
            var rackUuid=rack.uuid;
            if (_.difference(this._oUuidToTubes[orderUuid], this._oUuidToMovedTubes[orderUuid]).length === 0) {
              if (_.isUndefined(this._emptyRacksByOrder[orderUuid])) {
                this._emptyRacksByOrder[orderUuid] = [];
              }
              this._emptyRacksByOrder[orderUuid] =  this._emptyRacksByOrder[orderUuid].concat(rackUuid);
            }
          }, this));
        }, this));
      }, this));
    },

    rerack: function () {
      var thisModel = this;

      var orderPromisesByRack = _.map(thisModel.inputRacks, _.bind(function(rack){
        return $.when.apply(null, [$.when(rack)].concat(this._ordersForMovedTubes[rack.uuid]));
      }, this));

      var ordersByUuid = {};
      var racksPerOrderUuid;

      return $.when.apply(null, orderPromisesByRack)
      .then(function(){
        // FIX:
        var promises = (!_.isArray(arguments[0]))? [arguments] : arguments;
        // END
        racksPerOrderUuid = _
        .reduce(promises, function(memo, rackOrders){
          var rack   = _.head(rackOrders);
          var orders = _.chain(rackOrders).rest().flatten().value();
          _.each(orders, function(order) {
            ordersByUuid[order.uuid] = order;

            memo[order.uuid] = (memo[order.uuid] || []).concat(rack.uuid);
          });

          return memo;
        }, {});

        var updateMessage = {};
        updateMessage[thisModel.outputRack.uuid] = { event: "start" };
        return updateAllOrders(
          _.map(ordersByUuid, function(order) { return [order, updateMessage]; }), thisModel.contentType
        );
      })

      .then(function moveTubesIntoNewRack(firstOrder){
        // Carry out the tube move
        return firstOrder.root
        .actions
        .tube_rack_moves
        .create(thisModel.tubeMoves);
      })

      .then(function(){
        // Update orders to unuse empty racks and complete the new rack.

        var orderUpdatePairs = _.map(
          racksPerOrderUuid,
          function(racks, orderUuid){
            var updateMessage = _.reduce(racks, function(memo, rackUuid){
              // We only want to unuse racks in an order if they no longer contain tubes for
              // the order
              if (_.contains(thisModel._emptyRacksByOrder[orderUuid], rackUuid)) {
                memo[rackUuid] = {event: "unuse"};
              }

              return memo;
            }, {});
            updateMessage[thisModel.outputRack.uuid] = {
              event: "complete"
            };

            return [ordersByUuid[orderUuid],updateMessage];
          });

          return updateAllOrders(orderUpdatePairs, thisModel.contentType);
      })

      .then(function(){
        // ...send thisModel back to the controller.
        return thisModel;
      });



      function updateAllOrders(orderUpdatePairs, contentType) {
        if (contentType === undefined) {
          throw "Content type must be defined for rack update messages.";
        };

        return $.when.apply(null, _.map(orderUpdatePairs, function(pair) {
          var order         = pair[0];
          var eventMessages = pair[1];

          var updateMessage = {items:{}};
          updateMessage.items[thisModel.activeRole] = eventMessages;
          return order.update(updateMessage);
        }));
      }
    },


    createOutputRack: function () {
      var thisModel = this;

      return thisModel.owner
      .getS2Root()
      .then(function (root) {
        return Operations.registerLabware(
          root[thisModel.outputModelType],
          thisModel.contentType,
          thisModel.purpose,
          {
            number_of_rows:    thisModel.nbOfRows,
            number_of_columns: thisModel.nbOfColumns
          }
        );
      })
      .then(function (state) {
        thisModel.cache.push(state.labware);
        thisModel.outputRack = state.labware;
        return state.labware;
      })
    }

  });

  function getTubeBarcodesFromRacks(racks) {
    return _.chain(racks)
      .pluck("tubes")
      .map(function(tubes) { return _.values(tubes); })
      .flatten()
      .map(function(tube){ return tube.labels.barcode.value; })
      .value();
  }

  function tubeCountPerRack(racks) {
    return _.chain(racks)
      .indexBy("uuid")
      .reduce(function(memo, rack, rackUuid){
        memo[rackUuid] = _.keys(rack.tubes).length;
        return memo;
      }, {})
      .value();
  }

  function mapBarcodeToSource(memo, rack) {
    return _.reduce(rack.tubes, function(tubesMemo, tube, sourceLocation) {
      tubesMemo[tube.labels.barcode.value] = {
        "source_uuid":      rack.uuid,
        "source_location":  sourceLocation,
      };      
      return _.extend(memo, tubesMemo);
    }, {});
  }
  
  function orderPromisesForTube(rack, tube) {
    return rack.root.find(tube.uuid).then(function(labware) {
      return labware.orders();
    });
  }

  return ReRackingModel;
});
