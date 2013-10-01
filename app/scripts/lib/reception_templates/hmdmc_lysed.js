define([
  'text!reception_templates/hmdmc_lysed/csv_template.json',
  'text!reception_templates/hmdmc_lysed/csv_template_display.json'
], function(updates, display) {
  'use strict';

  return function(register) {
    register('hmdmc_lysed', {
      friendly_name:         "HMDMC - lysed",
      manifest_path:         "scripts/lib/reception_templates/hmdmc_lysed/manifest.xls",
      model:                 "tube",
      sample_type:           "RNA",
      aliquot_type:          "NA+P",
      templates: {
        updates: JSON.parse(updates),
        display: JSON.parse(display)
      },
      header_line_number:    8,
      sample_types:         ["Cell Pellet"]
    });
  };
});

