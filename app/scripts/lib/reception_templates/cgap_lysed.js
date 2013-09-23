define([
  'text!reception_templates/cgap_lysed/updates.json',
  'text!reception_templates/cgap_lysed/display.json'
], function(updates, display) {
  'use strict';

  return {
    cgap_lysed: {
      friendly_name:         "CGAP - lysed",
      manifest_path:         "scripts/lib/reception_templates/cgap_lysed/manifest.xls",
      model:                 "tube",
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
