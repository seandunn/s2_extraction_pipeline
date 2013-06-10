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
