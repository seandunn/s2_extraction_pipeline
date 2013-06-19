define([
  'extraction_pipeline/models/base_page_model'
], function (BasePageModel) {
  'use strict';

  var SummaryPageModel = Object.create(BasePageModel);

  $.extend(SummaryPageModel, {

    init: function (owner) {
      this.owner = owner;
      this.labwares = $.Deferred();
      this.initialiseCaching();
      return $.Deferred().resolve(this).promise();
    },

    setupModel: function (setupData) {
      this.cache.push(setupData.batch);
      this.user = setupData.user;
      this.batch = setupData.batch;
      var thisModel = this;
      var deferred = $.Deferred();
      this.ordersByUUID = {};
      getInputResources(thisModel)
        .fail(function (error) {
          deferred.reject({message: error.message, previous_error: error});
        })
        .then(function (inputs) {
          thisModel.labwares.resolve(inputs);
        })
        .fail(function (error) {
          deferred.reject({message: "Couldn't find the orders!!", previous_error: error});
        })
        .then(function () {
          return deferred.resolve(thisModel);
        });
      return deferred.promise();
    }
  });

  function getInputResources(model, filteringFunc) {
    var inputs = [];
    var deferred = $.Deferred();
    filteringFunc = filteringFunc || function (item) {
      // TODO: need to agree on a filtering criteria
      return true;
    };
    model.batch.orders
      .then(function (orders) {
        var items = _.chain(orders)
          .map(function (order) {
            model.ordersByUUID[order.uuid] = order;
            return _.values(order.items);
          })
          .flatten()
          .value();
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
        deferred.reject({message: "Could not get the input resources ", previous_error: null});
      })
      .then(function () {
        return deferred.resolve(inputs);
      });
    return deferred.promise();
  }


  return SummaryPageModel;
});


