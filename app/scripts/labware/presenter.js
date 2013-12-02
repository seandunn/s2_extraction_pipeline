define([
  "labware/standard_mappers"
], function(StandardMapper) {
  'use strict';

  // This is a mixin for classes that wish to do labware presentation.
  return {
    presentResource: function(resource) {
      return _.isUndefined(resource) ? undefined : StandardMapper(resource);
    }
  };
});
