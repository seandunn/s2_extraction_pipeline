//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
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
          aliquot: "blood",
          defaults: {cellular_material:{lysed: false}}
        }
      },

      studies: {
        SIGhumbio: {
          friendly_name: "SIGhumbio",
          sanger_sample_id_core: "SIGhumbio"
        },
        HipSci_Blood_Collection: {
          friendly_name: "HipSci Blood Collection",
          sanger_sample_id_core: "HipSci_Blood_Collection"
        },
        SIGhum: {
          friendly_name: "SIGhum",
          sanger_sample_id_core: "SIGhum"
        },
        "CRUK-Pilot-ORG": {
          friendly_name: "CRUK-Pilot-ORG",
          sanger_sample_id_core: "ORG"
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
