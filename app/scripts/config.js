define([
  "underscore"
], function() {
  'use strict';

  var printerTypes = {
    1: {
      name: '96 Well Plate Printer',
      canPrint: _.partial(_.contains, ["plate", "tube_rack"])
    },
    2: {
      name: 'Tube Printer',
      canPrint: _.partial(_.contains, ["tube", "spin_column"])
    },
    3: {
      name: 'Rack Printer',
      canPrint: _.partial(_.contains, ["tube_rack"])
    }
  };

  function printer(name,type){
    var details = printerTypes[type];
    return {
      name:         name,
      type:         type,
      friendlyName: name + ' ' + details.name,
      canPrint:     details.canPrint
    };
  }

  return {
    // Configure the API to S2
    apiUrl: 'http://psd2f.internal.sanger.ac.uk:8000/',
    mergeServiceUrl: 'http://psd2g.internal.sanger.ac.uk:8100/manifest-merge-service/',

    // No touching! Release branch value as it's picked up by the deployment script
    release: 'development_branch',

    verboseLevel: "NONE", // DEBUG, WARNING, ERROR, NONE

    withLoggingWindow: false,

    ajax: function(options) {
      return $.ajax(options)
          .then(function(result) {
            return {responseText:result};
          })
          .fail(function(error){
            throw "AJAX response error: "+ error.responseText;
          })
    },

    // Configure the print service
    printServiceUrl: 'http://psd2f.internal.sanger.ac.uk:8000/printers/legacy/soap',
    printers: [
      printer('e367bc', 2),
      printer('d304bc', 1)
    ],

    messageTimeout: 5000,
    // Handler for exceptions (does absolutely nothing, but could try..catch!)
    exceptionHandling: function(callback) {
      callback();
    },

    // This is for logging only not for authentication or authorisation.
    UserData: {
      "0000000000001": "TEST_USER_1",
      "0000000000002": "TEST_USER_2"
    }
  };

});
