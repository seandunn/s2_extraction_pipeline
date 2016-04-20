//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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
        "Unlysed": {
          sample: "Blood",
          aliquot: "!NA",
          defaults: {cellular_material:{lysed: false}}
        },
        "Lysed": {
          sample: "Blood",
          aliquot: "NA+P",
          defaults: {cellular_material:{lysed: true}}
        }
      },

      studies: {
        Malaria: {
          friendly_name: "Malaria",
          sanger_sample_id_core: "malaria"
        }
      },

      extras: {
        "Lysed?": _.optional("cellular_material", "lysed"),
        "GENDER": _.optional("gender")
      },

      validation: validations.nonEmptyString(validations.mandatory, "Barcode"),
      emptyRow:   function(row) { return row[2]; }
    }
  };
});
