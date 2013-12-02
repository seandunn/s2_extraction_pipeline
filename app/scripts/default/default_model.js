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
      this.cache.fetchResourcePromiseFromBarcode(barcode)
          .fail(function(){
            return deferred.reject({message:"Couldn't find any labware with a '"+barcode+"' barcode!"});
          })
          .then(function (labware) {
            defaultModel.labware = labware;
            return labware.order();
          })
          .then(function (order) {
            return order.batchFor(function (item) {
              return item.uuid === defaultModel.labware.uuid && item.status==="done";
            });
          })
          .then(function (batch) {
            defaultModel.batch = batch;
            return deferred.resolve(defaultModel);
          })
          .fail(function () {
            // we resolve the promise because we already have a labware
            // we simply didn't find a batch associated.
            return deferred.resolve(defaultModel);
          });
      return deferred.promise();
    },

    setUserFromBarcode: function (barcode) {
      var defaultModel = this;
      var deferred = $.Deferred();
      if (config.UserData[barcode]){
        this.user = config.UserData[barcode];
        this.owner.getS2Root(this.user);
        deferred.resolve(this);
      } else {
        deferred.reject({message:"User barcode not recognised."});
      }
      return deferred.promise();
    },

    isValid: function(){
      return this.user && this.labware;
    }

  });

  return DefaultPageModel;
});

