define([], function(mapperConfig) {
  'use strict';
  return {
    // Configure the API to S2
    apiUrl: 'http://psd-dev.internal.sanger.ac.uk:8000/',
    ajax: function(options) {
      return $.ajax(options).then(function(result) { return {responseText:result}; });
    },

    // Configure the print service
    printServiceUrl: 'http://psd-dev.internal.sanger.ac.uk:8000/printers/legacy/soap',
    printers: [ {name: 'e367bc', type: 2} ],
    inputTubeKitTypes: { "binding_tube_for_extraction_nap" : "DNA/RNA",
                         "binding_tube_for_extraction_dnap" : "DNA",
                         "binding_tube_for_extraction_rnap" : "RNA"}
  };
});
