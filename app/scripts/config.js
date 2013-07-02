define(['extraction_pipeline/lib/logger'], function(Logger) {
  'use strict';

  var printerTypes = {
    1: '96 Well Plate Printer',
    2: 'Tube Printer',
    3: 'Rack Printer'
  };

  function printer(name,type){
    return {
      name: name,
      type: type,
      friendlyName: name + ' ' + printerTypes[type]
    };
  }

  return {
    // Configure the API to S2
    apiUrl: 'http://psd2g.internal.sanger.ac.uk:8000/',

    // Don't change the release branch value as it's picked up by the deployment script
    release: 'development_branch',

    ajax: function(options) {
      Logger.debug("AJAX request: ", options);
      return $.ajax(options)
          .then(function(result) {
            Logger.debug("AJAX response (success) :",result);
            return {responseText:result};
          })
          .fail(function(error){
            Logger.error("AJAX response (error) :",error);
          })
    },

    // Configure the print service
    printServiceUrl: 'http://psd2g.internal.sanger.ac.uk:8000/printers/legacy/soap',
    printers: [
      printer('e367bc', 2),
      printer('d304bc', 1)
    ],

    messageTimeout: 5000,
    // Handler for exceptions (does absolutely nothing, but could try..catch!)
    exceptionHandling: function(callback) {
      callback();
    },

    UserData: {
      "0000000000001": "TEST_USER_1",
      "0000000000002": "TEST_USER_2"
    }
  };

});
