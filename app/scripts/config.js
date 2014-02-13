define([
  "underscore"
], function() {
  "use strict";

  var printerTypes = {
    1: {
      name: "96 Well Plate Printer",
      canPrint: _.partial(_.contains, ["plate", "tube_rack"])
    },
    2: {
      name: "Tube Printer",
      canPrint: _.partial(_.contains, ["tube", "spin_column", "filter_paper"])
    },
    3: {
      name: "Rack Printer",
      canPrint: _.partial(_.contains, ["tube_rack"])
    }
  };

  function printer(name,type){
    var details = printerTypes[type];
    return {
      name:         name,
      type:         type,
      friendlyName: name + " " + details.name,
      canPrint:     details.canPrint
    };
  }

  return {
    // Configure the API to S2
    apiUrl: "SERVER_NAME",
    mergeServiceUrl: "SERVER_NAME/manifest-merge-service/",

    // No touching! Release branch value as it's picked up by the deployment script
    release: "development_branch",

    verboseLevel: "NONE", // DEBUG, WARNING, ERROR, NONE

    withLoggingWindow: false,

    ajax: function(options) {
      return $.ajax(options)
      .then(function(result) {
        return {responseText:result};
      })
      .fail(function(error){
        throw "AJAX response error: "+ error.responseText;
      });
    },

    // Configure the print service
    printServiceUrl: "SERVER_NAME/printers/legacy/soap",

    printers: [
      printer("g216bc", 2),
      printer("g214bc", 1),
      printer("e367bc", 2),
      printer("d304bc", 1)
    ],

    messageTimeout: 5000,
    // Handler for exceptions (does absolutely nothing, but could try..catch!)
    exceptionHandling: function(callback) {
      callback();
    },

    // This is for logging only not for proper authentication

    defaultPages: [
      "pipeline",
      "lab-activities"
    ],

    // Add an exclusive pages as an attribute list on each user.
    UserData: {
      "0000000000001": {
        email: "Test_User_1",
        pages: [ "lab-management" ]
      },

      "0000000000002": {
        email: "Test_User_2",
      }
    }

  };

});
