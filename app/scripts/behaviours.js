define([
       'extraction_pipeline/behaviours/row_by_row',
       'extraction_pipeline/behaviours/page_complete',
], function() {
  var behaviours = _.chain(arguments).reduce(function(behaviours, behaviour) {
    behaviour.register(function(name, constructor) {
      behaviours[name] = constructor;
    });
    return behaviours;
  }).value();

  return function(name) {
    return behaviours[name]();
  };
});
