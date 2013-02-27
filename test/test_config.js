define(['mapper_test/test_config'], function(mapperConfig) {
  'use strict';
  var config = $.extend(mapperConfig, {
  });

  /*
    config.setTestJson = function(name) {
    var testJson = require(name)();
    if (!config.testJSON) {
      config.testJSON = {};
    }
    config.testJSON[config.currentStage] = testJson;
  }
  */

  return config;
});
