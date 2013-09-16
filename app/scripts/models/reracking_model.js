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
      return $.Deferred().resolve(this).promise();
    },

    reset: function () {
      this.inputRacks = [];
      delete this.contentType;
      delete this.outputRack;
    },

    isReady: function() { return this.inputRacks.length > 1; },

    // Should lookup a rack resource and add it to the model.
    addRack: function (rackBarcode) {
      var deferred = $.Deferred();
      var thisModel = this;
      var resource;

      var isInRackList = _.find(thisModel.inputRacks, function (rack) {
        return rack.labels.barcode.value === rackBarcode;
      });

      if (isInRackList) { return deferred.reject({message: "already there"}).promise; }

      if (!thisModel.contentType) { thisModel.nbOfTubesToRerack = 0; }

      this.cache
      .fetchResourcePromiseFromBarcode(rackBarcode, "tube_racks")
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

        var contentTypesInNewRack = _
        .chain(resource.tubes)
        .pluck("aliquots")
        .flatten()
        .pluck("type")
        .groupBy()
        .keys()
        .value();

        if (contentTypesInNewRack.length > 2) {
          // is the rack homogeneous (sanity check) ?
          // DNA + Solvent or RNA + Solvent
          var msg = "The content of the rack is not homogenous. It contains " +
            contentTypesInNewRack.join(" & ") +
            " aliquots. Please check the rack content.";
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

      $.when.apply(null, orderPromisesByRack)
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

        var jsonForOutputRack = {items:{}};

        jsonForOutputRack.items["samples.rack.stock.rna"] = {};

        jsonForOutputRack
        .items["samples.rack.stock.rna"][thisModel.outputRack.uuid] = {
          event: "start"
        };

        var orderUpdatePromises = _.map(ordersByUuid, function(order){
          return order.update(jsonForOutputRack);
        });

        return $.when.apply(null, orderUpdatePromises);
      })

      .then(function(firstOrder){
        // Carry out the tube move
        return firstOrder.root
        .actions
        .tube_rack_moves
        .create(thisModel.tubeMoves);
      })

      .then(function(){
        // Update orders to unuse empty racks and complete the new rack.

        var orderUpdatePromises = _.map(
          racksPerOrderUuid,
          function(racks, orderUuid){
            var jsonForOrderUpdate = {items:{}};

            // jsonForOrderUpdate.items["samples.rack.stock.rna"] = {};
            jsonForOrderUpdate.items["samples.rack.stock.rna"] = _.reduce(racks, function(memo, rackUuid){
              if (_.contains(thisModel.racksToEmpty, rackUuid)){
                memo[rackUuid] = {event: "unuse"};
              }

              return memo;
            }, {});

            jsonForOrderUpdate
            .items["samples.rack.stock.rna"][thisModel.outputRack.uuid] = {
              event: "complete"
            };

            return ordersByUuid[orderUuid].update(jsonForOrderUpdate);
          }
        );

        return $.when.apply(null, orderUpdatePromises);
      })

      .then(function(){
        // Send thisModel back to the controller.
        return thisModel;
      });

    },


    printRackBarcode: function (printerName) {
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
      .then(function(rack){
        thisModel.printBarcodes([rack], printerName);
        return rack;
      });

    }


  });

  return ReRackingModel;
});
