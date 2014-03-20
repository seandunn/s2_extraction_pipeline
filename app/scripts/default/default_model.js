define([
    'config'
  , 'models/base_page_model'
], function (config, BasePageModel) {
  'use strict';

  var DefaultPageModel = Object.create(BasePageModel);

  $.extend(DefaultPageModel, {
    init:function (owner) {
      this.owner = owner;
      this.initialiseCaching();
      return this;
    },

    setLabwareFromBarcode: function (barcode) {
      var defaultModel = this;
      var deferred = $.Deferred();

      defaultModel
      .cache
      .fetchResourcePromiseFromBarcode(barcode)

      .then(function (labware) {
        defaultModel.labware = labware;
        return labware.order();
      },
      function () {
        return deferred.reject({message:"Couldn't find any labware with a '"+barcode+"' barcode!"});
      })

      .then(function (order) {
        return order.batchFor(function (item) {
          return item.uuid === defaultModel.labware.uuid && item.status==="done";
        });
      }, 
      function() {
        return deferred.reject({message:"Couldn't find an order associated with the barcode '"+barcode+"'!"});
      })

      .then(function (batch) {
        defaultModel.batch = batch;
        return deferred.resolve(defaultModel);
      },
      function () {
        // We reset the batch from the previous value it had on the model and
        // we resolve the promise because we already have a labware
        // we simply didn't find a batch associated.        
        defaultModel.batch = null; 
        return deferred.resolve(defaultModel);
      });

      return deferred.promise();
    }

  });

  return DefaultPageModel;
});

