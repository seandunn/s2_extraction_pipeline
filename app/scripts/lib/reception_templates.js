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

  var Templates = {
    templateList: []
  };
  var register = function(name, template) {
    Templates[name] = _.extend(template, {
      json_template:         JsonTemplater.applicator(templateTransform(template.templates.updates)),
      json_template_display: JsonTemplater.applicator(displayTransform(template.templates.display)),
      validation:            template.validation || _.identity,
      generator:             Generators[template.model](template),
      reader:                Readers[template.model](template)
    });
    Templates.templateList.push({
      template_name: name,
      friendly_name: template.friendly_name,
      sample_types:  template.sample_types
    });
  };

  _.chain(arguments)
   .drop(3)
   .each(function(template) { template(register); })
   .value();

  return Templates;
});
