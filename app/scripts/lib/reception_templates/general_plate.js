define([
  'text!reception_templates/general_plate/csv_template.json',
  'text!reception_templates/general_plate/csv_template_display.json'
], function(updates, display) {
  'use strict';

  return {
    general_plate: {
      friendly_name:         "General Plate manifest",
      manifest_path:         "scripts/lib/reception_templates/general_plate/manifest.xls",
      model:                 "plate",
      aliquot_type:          "NA+P",
      templates: {
        updates: JSON.parse(updates),
        display: JSON.parse(display)
      },
      header_line_number:    8,
      sample_types:         ["Cell Pellet"]
    }
  };
});
