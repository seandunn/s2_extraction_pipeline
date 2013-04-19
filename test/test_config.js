define(['mapper_test/test_config'], function (mapperConfig) {
  'use strict';
  return $.extend(mapperConfig, {
    exceptionHandling: function(callback) {
      callback();
    }
  });
});
