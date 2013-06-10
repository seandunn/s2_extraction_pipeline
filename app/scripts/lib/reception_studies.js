define([
], function () {
  'use strict';

  var Studies = {
    study_A: {
      friendly_name: "Study A",
      sanger_sample_id_core: "study_a_s2"
    },
    study_B: {
      friendly_name: "StudyB",
      sanger_sample_id_core: "study_b_s2"
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
