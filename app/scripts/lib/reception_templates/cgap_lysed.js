define([
  'text!reception_templates/cgap_lysed/updates.json',
  'text!reception_templates/cgap_lysed/display.json'
], function(updates, display) {
  'use strict';

  return {
    cgap_lysed: {
      friendly_name: "CGAP - lysed",

      // Details surrounding the manifest itself: the template file and the line on which the
      // headers can be found.
      manifest: {
        path:               "scripts/lib/reception_templates/cgap_lysed/manifest.xls",
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
        "Cell Pellet": "NA+P"
      },

      // Studies that are supported by this manifest.
      studies: {
        QC1Hip: {
          friendly_name: "QC1Hip",
          sanger_sample_id_core: "QC1Hip"
        },
        QC2Hip: {
          friendly_name: "QC2Hip",
          sanger_sample_id_core: "QC2Hip"
        },
        SBC: {
          friendly_name: "Skin Biopsy Collection",
          sanger_sample_id_core: "SBC"
        }
      }
    }
  };
});
