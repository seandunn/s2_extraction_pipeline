define([], function() {
  'use strict';

  var DeferredCache = Object.create(null);

  _.extend(DeferredCache, {
    init: function() {
      var instance = Object.create(DeferredCache);
      var results  = $.Deferred();
      _.extend(instance, {
        // Retrieve an instance from the cache using the handler, which will filter the cache to
        // find the match, and possibly deal with missing results in a particular fashion.
        get: function(requester, filter, missing) {
          results.then(function(array) {
            var result = _.find(array, filter);
            return ($.Deferred())[result ? 'resolve' : 'reject'](result);
          }).then(function(resource) {
            return resource;  // Result remains the same on success
          }, function() {
            return missing(); // Result may be handled differently
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
