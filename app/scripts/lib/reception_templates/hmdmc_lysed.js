//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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
        "Tissue Non-Tumour":       {sample: "Tissue Non-Tumour", aliquot: "!NA"},
        "Tissue Tumour":           {sample: "Tissue Tumour",     aliquot: "!NA"},
        "Blood":                   {sample: "Blood",             aliquot: "!NA"},
        "Cell Pellet":             {sample: "Cell Pellet",       aliquot: "!NA"}
      },

      studies: {
        "fibroblast": {
          friendly_name: "Fibroblast Collection",
          sanger_sample_id_core: "fibroblast",
          defaults: {
            hmdmc_number: null
          }
        },
        "13-058": {
          friendly_name: "Skin Biopsy Collection (HMDMC 13-058)",
          sanger_sample_id_core: "SBC_13-058",
          defaults: {
            hmdmc_number: "13-058"
          }
        }
      },

      extras: {
        "HMDMC": _.picker("hmdmc_number")
      },

      validation: validations.nonEmptyString(validations.optional, "GENDER")
    }
  };
});

