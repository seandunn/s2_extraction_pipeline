define([
  'extraction_pipeline/models/base_page_model'
    ,'extraction_pipeline/csv_parser'
], function (BasePageModel,CSVParser) {
  'use strict';

  var Model = Object.create(BasePageModel);

  $.extend(Model, {
    init:function (owner, config) {
      this.owner = owner;
      this.config = config;
      this.user = undefined;
      this.batch = undefined;
      this.inputs = $.Deferred();
      this.output = [];
      this.initialiseCaching();
//      this.initialiseConnections(config);
      return this;
    },
    fire:function () {

      //this.preparedTransferData;

      this.owner.childDone(this, "transferDone", {});
    },
    analyseFileContent:function (data) {

      this.preparedTransferData = CSVParser.convertCSVDataToJSON(data.csvAsTxt);

      var expectedNbOfTubes;
      var arrayOfExpectedBarcodes;
      this.inputs
          .then(function(inputs){
            expectedNbOfTubes = inputs.length;
            arrayOfExpectedBarcodes = _.map(inputs,function(resource,key){
              return resource.labels.barcode.value});
          });
      var arrayOfBarcodesInRack = _.keys(this.preparedTransferData);
      var nbOfTubesInRack = arrayOfBarcodesInRack.length;

      if (nbOfTubesInRack !== expectedNbOfTubes){
        return this.owner.childDone(this,"error", {message:"The number of tube is not correct. The current batch" +
            " contains "+expectedNbOfTubes+" tubes, while the current transfer file contains "+nbOfTubesInRack+" tubes!"});
      }

      var missingBarcodes = _.difference(arrayOfExpectedBarcodes,arrayOfBarcodesInRack);
      if (missingBarcodes.length !== 0){
        return this.owner.childDone(this,"error", {
          message:
              "The number of tube is correct BUT not all the barcodes are matching. " +
              "The tubes with the following barcodes are missing:<ul>" +
              _.reduce(missingBarcodes,function(memo,barcode){ return memo + "<li>" + barcode + "</li>"},"") +
              "</ul>"
        });
      }



      return this.owner.childDone(this, "fileValid");
    },
    setBatch:function (batch) {
      this.cache.push(batch);
      this.batch = batch;
      var model = this;
      setupInputs(model)
          .then(function () {
            model.owner.childDone(model, "batchAdded");
          })
          .fail(function () {
            model.owner.childDone(model, "error", {message:"couldn't load the batch resources!"});
          });
    },
    setUser:function (userUUID) {
      this.user = userUUID;
      this.owner.childDone(this, "userAdded");
    }

//    validateKitTubes:function (kitType) {
//      return (this.config.kitType == kitType);
//    },

//    fire: function() {
//      var model = this;
//      if (model.kit.barcode && model.kit.valid) {
//        model.batch.update({kit: model.kit.barcode}).then(function() {
//          model.kitSaved = true;
//          model.owner.childDone(model, 'saved', {});
//        });
//      }
//    }
  });

  function setupInputs(that) {
    var inputs = [];
    return that.batch.items.then(function (items) {
      return $.when.apply(null,
          _.chain(items)
              .filter(function (item) {
                return item.role === that.config.input.role && item.status === 'done';
              })
              .map(function (item) {
                return that.cache.fetchResourcePromiseFromUUID(item.uuid)
                    .then(function (resource) {
                      inputs.push(resource);
                    });
              })
              .value());
    })
        .then(function () {
          return that.inputs.resolve(inputs);
        }).fail(that.inputs.reject);
  }

  return Model;
});
