define([
  'text!reception_templates/general_plate/updates.json',
  'text!reception_templates/general_plate/display.json'
], function(updates, display) {
  'use strict';

  return {
    general_plate: {
      friendly_name:         "General Plate manifest",
      manifest_path:         "scripts/lib/reception_templates/general_plate/manifest.xls",
      model:                 "plate",
      templates: {
        updates: JSON.parse(updates),
        display: JSON.parse(display)
      },
      header_line_number:    8,
      sample_types: {
        "Cell Pellet": "NA+P"
      }
    }
  };
});
