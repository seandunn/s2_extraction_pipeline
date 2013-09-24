define([
  'lib/reception_templates/generators/tube',
  'lib/reception_templates/generators/plate'
], function() {
  return _.reduce(arguments, function(m,v) { return _.extend(m,v); }, {});
});
