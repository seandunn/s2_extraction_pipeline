define([
  'lib/underscore_extensions/functional',
  'lib/underscore_extensions/tabular',
  'lib/underscore_extensions/utility',
  'lib/underscore_extensions/csv'
], function() {
  return _.reduce(arguments, function(underscore, extension) {
    underscore.mixin(extension);
    return underscore;
  }, _);
});
