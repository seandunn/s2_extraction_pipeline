define([
  'lib/reception_templates/generators/tube',
  'lib/reception_templates/generators/plate',
  'lib/reception_templates/generators/filter_paper',
  'lib/reception_templates/generators/vial'
], function() {
  return _.reduce(arguments, function(m,v) { return _.extend(m,v); }, {});
});
