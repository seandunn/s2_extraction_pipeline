define([
  'lib/json_templater',

  // Add new templates after this comment and they will be automatically loaded
  'reception_templates/cgap_lysed'
], function (JsonTemplater) {
  'use strict';

  var templateTransform = _.identity;
  var displayTransform  = function(json) { return _.reduce(json, function(m,v,i) { return _.extend(m,v); }, {}); };

  var Templates = {
    templateList: []
  };
  var register = function(name, template) {
    Templates[name] = _.extend(template, {
      json_template:         JsonTemplater.applicator(templateTransform(template.templates.updates)),
      json_template_display: JsonTemplater.applicator(displayTransform(template.templates.display))
    });
    Templates.templateList.push({
      template_name: name,
      friendly_name: template.friendly_name,
      sample_types:  template.sample_types
    });
  };

  _.chain(arguments)
   .drop(1)
   .each(function(template) { template(register); })
   .value();

  return Templates;
});
