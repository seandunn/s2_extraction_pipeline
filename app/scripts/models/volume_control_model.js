define([
  'extraction_pipeline/models/base_page_model'
], function (BasePageModel) {
  'use strict';

  var VolumeControlModel = Object.create(BasePageModel);

  $.extend(VolumeControlModel, {

    init:       function (owner, config) {
      this.owner = owner;
      this.config = config;
      this.inputs = $.Deferred();
      this.output = [];
      this.initialiseCaching();
      return $.Deferred().resolve(this).promise();
    },

    setupModel: function (setupData) {
      this.cache.push(setupData.batch);
      this.user = setupData.user;
      this.batch = setupData.batch;
      var thisModel = this;
      getInputResources(thisModel)
          .then(function (inputs) {
            return thisModel.inputs.resolve(inputs);
          }).then(function(){
            return $.Deferred().resolve(thisModel);
          });
    },

    setControlSourceFromBarcode:function (barcode) {
      var thisModel = this;
      return this.cache.fetchResourcePromiseFromBarcode(barcode)
          .then(function (rsc) {
            return thisModel.controlSource = rsc;
          });
    }

  });



  function getInputResources(model, filteringFunc) {
    var inputs = [];
    var promiseOnTheInputs = $.Deferred();
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
        .then(function () {
          return promiseOnTheInputs.resolve(inputs);
        }).fail(promiseOnTheInputs.reject);
    return promiseOnTheInputs.promise();
  }

  return VolumeControlModel;
});

