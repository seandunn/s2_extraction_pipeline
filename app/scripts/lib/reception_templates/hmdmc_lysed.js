define([
  "text!reception_templates/hmdmc_lysed/csv_template.json",
  "text!reception_templates/hmdmc_lysed/csv_template_display.json",
  "lib/reception_templates/validations"
], function(updates, display, validations) {
  "use strict";

  return {
    hmdmc_lysed: {
      friendly_name: "HMDMC - lysed",

      manifest: {
        path:               "scripts/lib/reception_templates/hmdmc_lysed/manifest.xls",
        header_line_number: 8
      },

      templates: {
        updates: JSON.parse(updates),
        display: JSON.parse(display)
      },

      model: "tube",

      sample_types: {
        "Tissue Non-Tumour": "!NA",
        "Tissue Tumour": "!NA",
        "Blood": "!NA"
      },

      studies: {
        "13-058": {
          friendly_name: "Skin Biopsy Collection (HMDMC 13-058)",
          sanger_sample_id_core: "SBC_13-058",
          defaults: {
            hmdmc_number: "13-058"
          }
        }
      },

      extras: {
        "HMDMC": "hmdmc_number"
      },

      validation: validations.nonEmptyString(validations.optional, "GENDER")
    }
  };
});

