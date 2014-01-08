define([
  "text!reception_templates/blood_manifest/updates.json",
  "text!reception_templates/blood_manifest/display.json",
  "lib/reception_templates/validations"
], function(updates, display, validations) {
  "use strict";

  return {
    blood_manifest: {
      friendly_name: "Blood manifest",

      manifest: {
        path:               "scripts/lib/reception_templates/blood_manifest/manifest.xls",
        header_line_number: 8
      },

      model: "tube",

      generator: "vial",

      templates: {
        updates: JSON.parse(updates),
        display: JSON.parse(display)
      },

      sample_types: {
        "Blood - Unlysed": {
          sample: "Blood",
          aliquot: "!NA",
          defaults: {cellular_material:{lysed: false}}
        }
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
      },

      custom_fields: [
        {
          friendly_name: "Viles per Sample",
          id: "viles_per_sample",
          initial_value: "2",
          validation: function(val) {
            if (_.isNaN(val) || !_.isNumber(val)) {
              return false;
            }

            if (val < 1) {
              return false;
            }

            return true;
          }
        }
      ],

      extras: {},

      validation: validations.nonEmptyString(validations.mandatory, "Tube Barcode"),
      emptyRow:   function(row) { return row[2]; }
    }
  };
});