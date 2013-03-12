define([], function() {
  'use strict';

  var config = {
    apiUrl:'', // NOT USED IN TESTING
    setupTest: function (testData, stepNo){
      var step = stepNo || 0

      testData = $.parseJSON(testData);
      config.createTestData(testData);

      var stepStage = testData.steps[step];
      config.stepStage = stepStage;
      config.stage = stepStage.description || "No description in JSON";

      config.url = stepStage.url;
      config.params = stepStage.request;
      return testData.steps[step].response;

    },

    finalDna: {},

    createTestData: function(testData){
      var output = '';

      for(var stepNo in testData.steps) {
        var step = testData.steps[stepNo]
        output += '<br/>Step' + stepNo + ':' + step.description +'. Needs a ' + step.method + '. Responds with ' +
            Object.keys(step.response)[0];

        config.finalDna[step.url + step.method + JSON.stringify(step.request)] = step.response;

      }

    },




    setTestJson: function(workflow){
      // Fixme Not working ideally yet still having to require
      // the package on module load.
      config.testJSON = require('json/'+workflow);
    },

    getTestJson: function(url){
      var path           = url.replace(/^http:\/\/\w*:?\d*\//,'/');
      var resultFromJson = config.testJSON[config.currentStage][path];

      if (resultFromJson === undefined)
        throw "Path: '"+path+"' not found in test JSON for stage: "
            +config.currentStage;

      return resultFromJson;
    },

    // cpResource: function (original_uuid, new_uuid) {
    //   var resourceJsonClone = JSON.parse(
    //     JSON.stringify(
    //      config.getTestJson()["/" + original_uuid]));

    //   resourceJsonClone.uuid = new_uuid;
    //   config.getTestJson ()["/" + new_uuid] = resourceJsonClone;
    // },

    // Dummy out the ajax call returned by S2Ajax to test from file.
    // Returns a Deferred instead of jqXHR.
    ajax: function (options){
      // a blank options.url should default to '/'
      options.url = options.url.replace(/http:\/\/localhost:\d+/,'');
      if (options.url.length === 0){
        options.url = '/';
        options.type = 'get';
        options.data = null;
      }

      console.log('------------------------');
      console.log('Sending ajax message for ' + config.stage);

      config.reqParams = options.url + options.type.toLowerCase() + JSON.stringify(options.data);
      console.log(config.reqParams);




      // We resolve the Deferred object before return so any callbacks added
      // with .done() are called as soon as they're added, which should solve 
      // testing latency issues.
      console.log(config);

      var response = config.finalDna[config.reqParams];
      console.log('Responding with a ' + typeof response);
      console.log(response);

      return $.Deferred().resolve({
        url:           options.url,
        'status':      200,
        responseTime:  750,
        responseText:  response
      });
    }
  };
  return config;
});

