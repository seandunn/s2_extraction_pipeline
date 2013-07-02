define(['mapper_test/test_config'], function (mapperConfig) {
  'use strict';
  return $.extend(mapperConfig, {
    exceptionHandling: function(callback) {
      callback();
    },

    UserData: {
      "0000000000001": "TEST_USER_1",
      "0000000000002": "TEST_USER_2"
    }
  });
});
