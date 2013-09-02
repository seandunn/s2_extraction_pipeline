define([
  'lib/underscore_extensions'
], function() {
  'use strict';

  return {
    from: function(dataAsText) {
      return _.chain(dataAsText)
              .parseAsSeparatedRows(",")
              .value();
    }
  };
});
