define(['mapper_test/test_config', 'text!extraction_pipeline/dna_and_rna_manual_extraction.json'], function (mapperConfig, json) {
  'use strict';
  var config = $.extend(mapperConfig, {
  });

  config.logToConsole = true;

  config.log = function (message, level) {
    if (!config.logToConsole) return; // do nothing

    var formats = [
      'background-color:darkgreen; color:white;',
      'background-color:darkblue; color:white;',
      'background-color:red; color:white;'
    ];

    if (typeof message === 'object') {
      console.log(message);
    }
    else {
      console.log('%c' + message, formats[level]);
    }

  };

  config.ajax = function (options) {
    // a blank options.url should default to '/'
    options.url = options.url.replace(/http:\/\/localhost:\d+/,'');

    if (options.url.length === 0){
      options.url  = '/'
      options.type = 'get'
      options.data = null
    }

//    console.log('Sending ajax message for ' + config.stage);
    if (options.data == undefined) {
      options.data = null;
    }
    config.reqParams = config.currentStep + '-' + options.url + options.type.toLowerCase() + (options.data);
//    console.log(config.reqParams);
    config.log('Sending ajax message for "' + config.reqParams + '"');

    // The real $.ajax returns a promise.  Please leave this as a defered as
    // it lets us spy on reject and resolve.
    var fakeAjaxDeferred = $.Deferred();

    // We resolve the Deferred object before return so any callbacks added
    // with .done() are called as soon as they're added, which should solve
    // testing latency issues.

    var response = config.completeWorkflow[config.reqParams];
    if (response === undefined) {
      config.log(config.reqParams, 1);
      config.log('\nRequest for: \n' + config.reqParams + '\nnot found in test data.', 2);

      var tmp = config.completeSteps[config.currentStep];
      var text = config.currentStep + '-' + tmp.url + tmp.method + JSON.stringify(tmp.request);
      config.log('\Found this instead: \n' + text, 2);
//      // Check whether this is a search we need to fake.
//      if (options.url === '/searches' && options.type.toLowerCase() === 'post') {
//        console.log('But we are searching for a ' + options.data.search.model  + ', so need to return the empty data');
//        //debugger;
//        fakeAjaxDeferred.resolve({
//          url:           options.url,
//          'status':      200,
//          responseTime:  750,
//          responseText:  JSON.parse(emptyTubeData).steps[0].response
//        });
//
//      } else {
      fakeAjaxDeferred.reject(fakeAjaxDeferred, '404 error');
//      }
    } else {
      config.log("Responding with:", 0);
      config.log(response);

      fakeAjaxDeferred.resolve({
        url:         options.url,
        'status':    200,
        responseTime:750,
        responseText:response
      });
      config.currentStep++;
    }
    return fakeAjaxDeferred;
  };
  json = JSON.parse(json);

  //initialise step count
  config.currentStep = 0;
  config.completeWorkflow = {}
  config.completeSteps = []
  var absoluteStep = 0;
  for (var stageNum in json) {
    for (var stepNum in json[stageNum].steps) {
      var step = json[stageNum].steps[stepNum];

      config.completeWorkflow[absoluteStep + '-' + step.url + step.method + JSON.stringify(step.request)] = step.response;
      absoluteStep++;
      config.completeSteps.push(step);
    }
  }

  config.printServiceUrl = 'http://psd-dev.internal.sanger.ac.uk:8000/printers/legacy/soap';
  config.printers = [ {name: 'e367bc', type: 1} ];

  return config;
});
