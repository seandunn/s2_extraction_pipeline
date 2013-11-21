define([
  'underscore_string',

  // Our extensions that we need to load
  'lib/underscore_extensions/functional',
  'lib/underscore_extensions/tabular',
  'lib/underscore_extensions/utility',
  'lib/underscore_extensions/csv',
  'lib/underscore_extensions/promises'
], function() {
  return _.chain(arguments).drop(1).reduce(function(underscore, extension) {
    underscore.mixin(extension);
    return underscore;
  }, _);
});
