define([
  "text!reception_templates/filter_paper/updates.json",
  "text!reception_templates/filter_paper/display.json",
  "lib/reception_templates/validations"
], function(updates, display, validations) {
  "use strict";

  return {
    filter_paper: {
      friendly_name: "Filter paper manifest",

      manifest: {
        path:               "scripts/lib/reception_templates/filter_paper/manifest.xls",
        header_line_number: 8
      },

      model: "filter_paper",

      templates: {
        updates: JSON.parse(updates),
        display: JSON.parse(display)
      },

      // Whilst the sample is actually blood, the filter paper lyses on contact!
      sample_types: {
        "Blood": "NA+P"
      },

      studies: {
        Malaria: {
          friendly_name: "Malaria",
          sanger_sample_id_core: "malaria"
        }
      },

      extras: {
        "Lysed?": "lysed"
      },

      validation: validations.nonEmptyString(validations.mandatory, "BARCODE"),
      emptyRow:   function(row) { return row[2]; }
    }
  };
});
