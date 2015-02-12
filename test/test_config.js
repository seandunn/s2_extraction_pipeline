//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
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
