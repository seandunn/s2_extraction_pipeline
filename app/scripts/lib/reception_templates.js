define([
  'lib/json_templater',
  'lib/reception_templates/generators',
  'lib/reception_templates/readers',

  // Add new templates after this comment and they will be automatically loaded
  'reception_templates/cgap_lysed',
  'reception_templates/general_plate'
], function (JsonTemplater, Generators, Readers) {
  'use strict';

  var templateTransform = _.identity;
  var displayTransform  = function(json) {
    return _.reduce(json, function(m,v,i) { return _.extend(m,v); }, {});
  };

  var Templates = 
    _.chain(arguments)
     .drop(3)
     .reduce(function(m,v) { return _.extend(m, enhance(v)); }, {})
     .value();

  Templates.templateList = _.map(Templates, function(template, name) {
    return {
      template_name: name,
      friendly_name: template.friendly_name,
      sample_types:  template.sample_types
    };
  });

  return Templates;

  function enhance(object) {
    return _.chain(object)
            .map(function(v,k) { return [k, enhanceTemplate(v)]; })
            .object()
            .value();
  }
  function enhanceTemplate(template) {
    return _.extend(template, {
      json_template:         JsonTemplater.applicator(templateTransform(template.templates.updates)),
      json_template_display: JsonTemplater.applicator(displayTransform(template.templates.display)),
      validation:            template.validation || _.identity,
      generator:             Generators[template.model](template)
    });
  }
});
