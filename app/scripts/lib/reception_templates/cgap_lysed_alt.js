//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([
  "text!reception_templates/cgap_lysed_alt/updates.json",
  "text!reception_templates/cgap_lysed_alt/display.json",
  "lib/reception_templates/validations"
], function(updates, display, validations) {
  "use strict";

  return {
    cgap_lysed_alt: {
      friendly_name: "CGAP - lysed (alternative)",

      // Details surrounding the manifest itself: the template file and the line on which the
      // headers can be found.
      manifest: {
        path:               "scripts/lib/reception_templates/cgap_lysed_alt/manifest.xls",
        header_line_number: 8
      },

      // There are two templates that are required to map the manifest data to other structures:
      // one maps for display on the screen, the other maps for updating the actual samples in
      // the system.
      templates: {
        updates: JSON.parse(updates),
        display: JSON.parse(display)
      },

      // The labware model that will be created for this manifest
      model: "tube",

      // Sample types that are supported by this manifest.  Selecting a particular sample type
      // infers the type of aliquots that will be created in the labware.
      sample_types: {
        "Cell Pellet": {sample: "Cell Pellet", aliquot: "NA+P"}
      },

      // Studies that are supported by this manifest.
      studies: {
        "3980STDY": {
          friendly_name: "3980STDY",
          sanger_sample_id_core: "3980STDY"
        },
        "3421STDY": {
          friendly_name: "3421STDY",
          sanger_sample_id_core: "3421STDY"
        },
        QC1Hip: {
          friendly_name: "QC1Hip",
          sanger_sample_id_core: "QC1Hip"
        },
        QC2Hip: {
          friendly_name: "QC2Hip",
          sanger_sample_id_core: "QC2Hip"
        },
        QC1Ibd: {
          friendly_name: "QC1Ibd",
          sanger_sample_id_core: "QC1Ibd"
        },
        QC2Ibd: {
          friendly_name: "QC2Ibd",
          sanger_sample_id_core: "QC2Ibd"
        },
        QC1Hmgp: {
          friendly_name: "QC1Hmgp",
          sanger_sample_id_core: "QC1Hmgp"
        },
        QC2Hmgp: {
          friendly_name: "QC2Hmgp",
          sanger_sample_id_core: "QC2Hmgp"
        },
        SIGhum: {
          friendly_name: "SIGhum",
          sanger_sample_id_core: "SIGhum"
        },
        CGaPSSV: {
          friendly_name: "CGaP Validation",
          sanger_sample_id_core: "CGaPSSV"
        },
        "ESDM_pathogen_challenge": {
          friendly_name:          "ESDM_pathogen_challenge",
          sanger_sample_id_core:  "ESDM_pathogen_challenge"
        },

        SBC: {
          friendly_name: "Skin Biopsy Collection",
          sanger_sample_id_core: "SBC"
        },

        Th2diff: {
          friendly_name: "Th2diff",
          sanger_sample_id_core: "Th2diff"
        },

        Ext_Test: {
          friendly_name: "Ext_Test",
          sanger_sample_id_core: "Ext_Test"
        }

      },

      validation: validations.nonEmptyString(validations.optional, "GENDER")
    }
  };
});
