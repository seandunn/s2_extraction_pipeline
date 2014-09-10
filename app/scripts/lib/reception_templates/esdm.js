define([
  "text!reception_templates/esdm/updates.json",
  "text!reception_templates/esdm/display.json",
  "lib/reception_templates/validations"
], function(updates, display, validations) {
  "use strict";

  return {
    esdm: {
      friendly_name: "ESDM",

      // Details surrounding the manifest itself: the template file and the line on which the
      // headers can be found.
      manifest: {
        path:               "scripts/lib/reception_templates/esdm/manifest.xls",
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
        ESDM_pathogen_challenge: {
          friendly_name: "ESDM pathogen challenge",
          sanger_sample_id_core: "ESDM_pathogen_challenge"
        }
      },

      validation: validations.nonEmptyString(validations.optional, "GENDER")
    }
  };
});
