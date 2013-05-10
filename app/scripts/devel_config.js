define(['mapper_test/test_config'
  , 'text!mapper_testjson/unit/root.json'
  , 'text!extraction_pipeline/dna_and_ran_manual_test_data.json'], function (mapperConfig, root, json) {
  'use strict';
  var config = $.extend(mapperConfig, {
    // Handler for exceptions (does absolutely nothing, but could try..catch!)
    exceptionHandling: function(callback) {
      callback();
    },
    printerTypes: {
      1 : '96 Well Plate Printer',
      2 : '1D Tube Printer',
      3 : 'Tube Rack Printer'
    },
    messageTimeout: 5000
  });

  var today = new Date;
  var todayFormatted = [
    ("00" + today.getDate()).slice(-2),        // for padding with zeros : 5 -> 05
    ("00" + (today.getMonth() + 1)).slice(-2), // for padding with zeros : 5 -> 05
    today.getFullYear()]
    .join('-');
  // because the date is hardcoded in the mapper (using today's date), we
  // have to make sure the test data can be adjusted to the same date
  json = json.replace(/_DATE_OF_TEST_/g, todayFormatted);

  config.loadTestData(json);
  config.cummulativeLoadingTestDataInFirstStage(root);
  return config;

});
