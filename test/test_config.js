define(['mapper_test/test_config'], function (mapperConfig) {
  'use strict';
  return $.extend(mapperConfig, {
    exceptionHandling: function(callback) {
      callback();
    },

    UserData: {
      "0000000000001": "Hopper",
      "0000000000002": "Hockney",
      "0000000000003": "Hodgkins",
      "0000000000004": "Hofer"
    }
  });
});
