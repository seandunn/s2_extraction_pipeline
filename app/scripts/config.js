define([
  'components/S2Mapper/test/json/dna_only_extraction'
], function (dnaJson) {
  'use strict';

  var config = {
    apiUrl:'', // NOT USED IN TESTING

    currentStage:'stage1',

    setTestJson:function (workflow) {
      // Fixme Not working ideally yet still having to require
      // the package on module load.
      config.testJSON = require('components/S2Mapper/test/json/' + workflow);
    },

    getTestJson:function (url) {
      config.setTestJson('dna_only_extraction');
      var path = url.replace(/^http:\/\/\w*:?\d*\//, '/');
      var resultFromJson = config.testJSON[config.currentStage][path];

      if (resultFromJson === undefined)
        throw "Path: '" + path + "' not found in test JSON for stage: " + config.currentStage;

      return resultFromJson;
    },

    cpResource:function (original_uuid, new_uuid) {
      var resourceJsonClone = JSON.parse(JSON.stringify(
          config.getTestJson()["/" + original_uuid]));
      resourceJsonClone.uuid = new_uuid;
      config.getTestJson()["/" + new_uuid] = resourceJsonClone;
    },

    // Dummy out the ajax call returned by S2Ajax to test from file.
    // Returns a Deferred instead of jqXHR.
    ajax:function (options) {
      var requestOptions = options;

      // a blank options.url should default to '/'
      if (options.url.length === 0) {
        requestOptions.url = '/';
      } else {
        requestOptions.url = options.url;
      }

      if (options.type === 'POST') requestOptions.url = options.url + '/' + JSON.stringify(options.data);

//      console.log('Sending ajax message:-');
//      console.log('Request options : ', requestOptions);

      var responseText = config.getTestJson(requestOptions.url);

//      console.log('Responding with:-');
//      console.log(responseText);

      // We resolve the Deferred object before return so any callbacks added
      // with .done() are called as soon as they're added, which should solve
      // testing latency issues.
      return $.Deferred().resolve({
        url:options.url,
        'status':200,
        responseTime:750,
        responseText:responseText
      });
    }
  };

  return config;
});
