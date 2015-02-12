//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  'mapper_test/resource_test_helper',
  'config',

  // These are dynamically loaded
  'spec/file_handling/manifests_spec',
  'spec/file_handling/nano_drop_spec',
  'spec/file_handling/racking_spec',
  'spec/file_handling/volume_spec',
  'spec/file_handling/tecan_spec'
], function(TestHelper) {
  'use strict';

  var modules = _.drop(arguments, 2);
  TestHelper(function(results) {
    describe("file handling", function() {
      _.each(modules, function(f) { f(results); });
    });
  });
});
