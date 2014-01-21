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
        return rack.orders();
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

    setFileContent: function (csvAsTxt) {
      var targetsByBarcode = CSVParser.from(csvAsTxt);
      var thisModel = this;

      var inputTubeBarcodes = _.chain(thisModel.inputRacks)
      .pluck("tubes")
      .map(function(tubes) { return _.values(tubes); })
      .flatten()
      .map(function(tube){ return tube.labels.barcode.value; })
      .value();

      if (_.difference(_.keys(targetsByBarcode), inputTubeBarcodes).length !== 0){
        throw "Racking file contains a tube not in the input racks";
      }

      if (Object.keys(targetsByBarcode).length > thisModel.outputCapacity){
        throw "Re-racking file includes " +
          thisModel.targetsByBarcode.length +
          " and the target rack has only " +
          thisModel.outputCapacity + " slots available.";
      }

      var tubeCountByRackUuid = _.chain(thisModel.inputRacks)
      .indexBy("uuid")
      .reduce(function(memo, rack, rackUuid){
        memo[rackUuid] = _.keys(rack.tubes).length;
        return memo;
      }, {})
      .value();

      var sourceMoves = _.reduce(thisModel.inputRacks, function(memo, rack){
        // This reduce produces source move JSON for all tubes potentially
        // all the tubes in the input racks.

        var rackTubes =  _.reduce(
          rack.tubes,
          function(tubesMemo, tube, sourceLocation){
            tubesMemo[tube.labels.barcode.value] = {
              "source_uuid":      rack.uuid,
              "source_location":  sourceLocation,
            };
            return tubesMemo;
          }, {});

          _.extend(memo, rackTubes);
          return memo;
      }, {});

      thisModel.tubeMoves = _.reduce(
        targetsByBarcode,
        function(memo, targetLocation, tubeBarcode){
          var move = sourceMoves[tubeBarcode];

          // These names are translated to JSON so need to be in snake_case.
          move.target_uuid     = thisModel.outputRack.uuid;
          move.target_location = targetLocation;

          memo.moves.push(move);
          return memo;
        }, { moves: [] });

        // Prepare a list of empty racks to "unuse" after the move.
        thisModel.racksToEmpty = _.chain(thisModel.tubeMoves.moves)
        .groupBy("source_uuid")
        .reduce(function(memo, moves, rack){
          memo[rack] = moves.length;
          return memo;
        }, {})
        .reduce(function(memo, moveCount, rackUuid){
          if (moveCount === tubeCountByRackUuid[rackUuid]) {
            memo.push(rackUuid);
          }

          return memo;
        }, [])
        .value();

        return thisModel;
    },

    rerack: function () {
      var thisModel = this;

      var orderPromisesByRack = _.map(thisModel.inputRacks, function(rack){
        return $.when.apply(null, [$.when(rack)].concat(rack.orders()));
      });

      var ordersByUuid = {};
      var racksPerOrderUuid;

      return $.when.apply(null, orderPromisesByRack)
      .then(function(){

        racksPerOrderUuid = _
        .reduce(arguments, function(memo, rackOrders){
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
              if (_.contains(thisModel.racksToEmpty, rackUuid)){
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

  return ReRackingModel;
});
