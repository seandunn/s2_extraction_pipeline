define([
  'lib/reception_templates/generators/tube'
], function() {
  return _.reduce(arguments, function(m,v) { return _.extend(m,v); }, {});
});
