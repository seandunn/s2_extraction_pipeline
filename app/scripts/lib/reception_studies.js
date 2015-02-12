//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
], function () {
  'use strict';

  var Studies = {
    QC1Hip: {
      friendly_name: "QC1Hip",
      sanger_sample_id_core: "QC1Hip"
    },
    QC2Hip: {
      friendly_name: "QC2Hip",
      sanger_sample_id_core: "QC2Hip"
    },

    "ESDM_pathogen_challenge": {
      friendly_name:          "ESDM_pathogen_challenge",
      sanger_sample_id_core:  "ESDM_pathogen_challenge"
    },

    SBC: {
      friendly_name: "Skin Biopsy Collection",
      sanger_sample_id_core: "SBC"
    },

    // The following are all collections for HMDMC numbers
    "13-058": {
      friendly_name: "Skin Biopsy Collection (HMDMC 13-058)",
      sanger_sample_id_core: "SBC_13-058",
      hmdmc_number: "13-058"
    }
  };

  // adds a studyList, used to simplify the html template parsing
  // it only contains something like :
  // [
  //   {
  //     study_name : "awesome_study",
  //     friendly_name : "My awesome study"
  //   }, ...
  // ]
  $.extend(Studies, {
    studyList: _.map(Studies, function (value, key) {
      return { study_name: key, friendly_name: value.friendly_name };
    })
  });

  return Studies;
});
