define([
  'text!reception_templates/cgap_lysed/csv_template.json',
  'text!reception_templates/cgap_lysed/csv_template_display.json'
], function (CGAPLysed,CGAPLysedDisplay) {
  'use strict';

  var Templates = {
    cgap_lysed: {
      friendly_name: "CGAP - lysed",
      model:         "tube",
      sample_type:   "RNA",
      aliquot_type:  "NA",
      json_template: JSON.parse(CGAPLysed),
      json_template_display: JSON.parse(CGAPLysedDisplay),
      header_line_number: 8
    }
  };

  // adds the manifest paths
  _.reduce(Templates, function(memo,value, key){
    $.extend(memo[key],{
      manifest_path:"scripts/lib/reception_templates/"+key+"/manifest.xls"
    });
    return memo;
  }, Templates);

  // adds a templateList, used to simplify the html template parsing
  // it only contains something like :
  // [
  //   {
  //     template_name : "awesome_template",
  //     friendly_name : "My awesome template"
  //   }, ...
  // ]
  $.extend(Templates, {
    templateList: _.map(Templates, function (value, key) {
      return { template_name: key, friendly_name: value.friendly_name };
    })
  });

  return Templates;
});
