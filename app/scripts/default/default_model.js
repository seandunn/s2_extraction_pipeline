define([
       'extraction_pipeline/models/base_page_model'
], function (BasePageModel) {
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
      return this.cache.fetchResourcePromiseFromBarcode(barcode).then(function (labware) {
        return defaultModel.labware = labware;
      }).then(function(labware){
        return labware.order();
      }).then(function(order){
          return order.batchFor(function (item) { return item.uuid === defaultModel.labware.uuid; });
      }).then(function (batch) {
          defaultModel.batch = batch;
          return defaultModel;
      }, function () {
        console.log("batch not found");
        return defaultModel;
      });
    },

    isValid: function(){
      return this.user && this.labware;
    },

  });

  return DefaultPageModel;
});

