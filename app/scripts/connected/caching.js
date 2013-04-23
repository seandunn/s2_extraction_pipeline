define([], function() {
  'use strict';

  var DeferredCache = Object.create(null);

  _.extend(DeferredCache, {
    init: function(missingHandler) {
      var instance = Object.create(DeferredCache);
      var results  = $.Deferred();
      _.extend(instance, {
        getByBarcode: function(requester, modelName, barcode) {
          results.then(function(array) {
            var result = _.find(array, function(r) { return r.labels.barcode.value === barcode; });
            var deferred = $.Deferred();
            deferred[result ? 'resolve' : 'reject'](result);
            return deferred;
          }).then(function(resource) {
            return resource;                           // Result remains the same on success
          }, function() {
            return missingHandler(modelName, barcode); // Result may be handled differently
          }).fail(function(message) {
            requester.displayErrorMessage(message);
          }).done(function(result) {
            recache(result);
            requester.updateModel(result);
          });
        },

        // Behave like a promise but remember that the value of 'results' above can change
        then:    resultsBound('then'),
        resolve: resultsBound('resolve')
      });
      return instance;

      // Deals with either maintenance of the cache so that we always have the freshest information
      // presented.  Essentially if the resource is in the list (by UUID) then we remove it, before
      // doing the default behaviour of caching it.
      function recache(resource) {
        results.then(function(array) {
          return _.chain(array).reject(function(cached) {
            return cached.uuid === resource.uuid;
          }).union([resource]).value();
        }).then(function(array) {
          results = $.Deferred().resolve(array);
        });
      }

      // Returns a function that will call the named function bound to the results.  This is not
      // the same as _.bind as the value of results can change on each call.
      function resultsBound(name) {
        return function() {
          return results[name].apply(results, arguments);
        };
      }
    }
  });

  return DeferredCache;
});
