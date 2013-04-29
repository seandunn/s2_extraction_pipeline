define(['mapper_test/test_config'
  , 'text!testjson/unit/root.json'
  , 'text!extraction_pipeline/dna_and_ran_manual_test_data.json'], function (mapperConfig, root, json) {
  'use strict';
  var config = $.extend(mapperConfig, {
    // Handler for exceptions (does absolutely nothing, but could try..catch!)
    exceptionHandling: function(callback) {
      callback();
    },
    printerType: function(type) {
      var types = {
        1 : '96 Well Plate Printer',
        2 : '1D Tube Printer',
        3 : 'Tube RackPrinter'
      };

      return types[type];
    }
  });

  config.loadTestData(json);
  config.cummulativeLoadingTestDataInFirstStage(root);
  return config;

});
