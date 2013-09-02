define([
  'mapper_test/resource_test_helper',
  'config',

  // These are dynamically loaded
  'spec/file_handling/manifests_spec',
  'spec/file_handling/nano_drop_spec',
  'spec/file_handling/racking_spec',
  'spec/file_handling/volume_spec'
], function(TestHelper) {
  'use strict';

  var modules = _.drop(arguments, 2);
  TestHelper(function(results) {
    describe("file handling", function() {
      _.each(modules, function(f) { f(results); });
    });
  });
});
