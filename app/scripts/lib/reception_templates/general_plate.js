define([
  'text!reception_templates/general_plate/updates.json',
  'text!reception_templates/general_plate/display.json'
], function(updates, display) {
  'use strict';

  return {
    general_plate: {
      friendly_name: "General Plate manifest",

      manifest: {
        path:               "scripts/lib/reception_templates/general_plate/manifest.xls",
        header_line_number: 8
      },

      model: "plate",

      templates: {
        updates: JSON.parse(updates),
        display: JSON.parse(display)
      },

      sample_types: {
        "Cell Pellet": "NA+P"
      },

      studies: {
        Foo: {
          friendly_name: "Foo study",
          sanger_sample_id_core: "foo"
        },
        Bar: {
          friendly_name: "Bar study",
          sanger_sample_id_core: "bar"
        }
      }
    }
  };
});
