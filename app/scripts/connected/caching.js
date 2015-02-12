//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([], function() {
  'use strict';

  var DeferredCache = Object.create(null);

  _.extend(DeferredCache, {
    init: function() {
      var instance = Object.create(DeferredCache);
      var pulled   = [];              // Resources that have been pulled from the cache
      var results  = $.Deferred();    // Resources currently in the cache
      _.extend(instance, {
        // Retrieve an instance from the cache using the handler, which will filter the cache to
        // find the match, and possibly deal with missing results in a particular fashion.
        get: function(filter, missing) {
          var deferred = $.Deferred();
          results.then(function(array) {
            var result = _.find(array, filter);
            return ($.Deferred())[result ? 'resolve' : 'reject'](result);
          }).then(function(resource) {
            return resource;                // Result remains the same on success
          }, function() {
            return missing(pulled, filter); // Result may be handled differently
          }).fail(function(message) {
            deferred.reject(message);
          }).done(function(result) {
            recache(result);
            deferred.resolve(result);
          });
          return deferred;
        },

        // Behave like a promise but remember that the value of 'results' above can change
        then:    resultsBound('then'),
        resolve: resultsBound('resolve'),

        // Caching can be treated as a store, allowing things to be cached and uncached.
        push: function() { _.each(arguments, recache); },
        pull: function() { _.each(arguments, uncache); }
      });
      return instance;

      // Deals with either maintenance of the cache so that we always have the freshest information
      // presented.  Recaching is about removing and then putting the resource back into the cache,
      // and uncaching is about removing without readding.
      function recache(resource) { manage(resource, [resource]); }
      function uncache(resource) { manage(resource, []); }
      function manage(remove, addition) {
        results.then(function(array) {
          return _.chain(array).reject(function(cached) {
            return cached.uuid === remove.uuid;
          }).union(addition).value();
        }).then(function(array) {
          pulled  = _.chain(pulled).union([remove]).difference(array).value();
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
