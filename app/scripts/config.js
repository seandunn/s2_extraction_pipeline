define(['mapper_test/test_config', 'text!mapper_test/json/dna_and_rna_manual_extraction.json'], function(mapperConfig, json) {
  'use strict';
  var config = $.extend(mapperConfig, {
  });





  config.ajax = function (options){
    // a blank options.url should default to '/'
    options.url = options.url.replace(/http:\/\/localhost:\d+/,'');

    if (options.url.length === 0){
      options.url  = '/'
      options.type = 'get'
      options.data = null
    }

    //increment the step if not a GET




    console.log('------------------------');
    console.log('Sending ajax message for ' + config.stage);

    config.reqParams = config.currentStep + '-' + options.url + options.type.toLowerCase() + JSON.stringify(options.data);
    console.log(config.reqParams);


    // The real $.ajax returns a promise.  Please leave this as a defered as
    // it lets us spy on reject and resolve.
    var fakeAjaxDeferred = $.Deferred();

    // We resolve the Deferred object before return so any callbacks added
    // with .done() are called as soon as they're added, which should solve
    // testing latency issues.

    var response = config.completeWorkflow[config.reqParams];
    if (response === undefined) {
      // if the stored result can't be found in the data but the url is in the root then
      // it means that the system couldn't find the data.

      console.log("AJAX[" + config.reqParams + "]: not found in " + config.stepJson);
      // Check whether this is a search we need to fake.
      if (options.url === '/searches' && options.type.toLowerCase() === 'post') {
        console.log('But we are searching for a ' + options.data.search.model  + ', so need to return the empty data');

        fakeAjaxDeferred.resolve({
          url:           options.url,
          'status':      200,
          responseTime:  750,
          responseText:  JSON.parse(emptyTubeData).steps[0].response
        });

      } else {

        fakeAjaxDeferred.reject(fakeAjaxDeferred, '404 error');
      }
    } else {
      console.log("AJAX[" + config.reqParams + "]: responding with:");
      console.log(response);

      fakeAjaxDeferred.resolve({
        url:           options.url,
        'status':      200,
        responseTime:  750,
        responseText:  response
      });
      config.currentStep++;
    }
    return fakeAjaxDeferred;
  };
  json = JSON.parse(json)
  //initialise step count
  config.currentStep = 0;
  config.completeWorkflow = {}
  config.completeSteps = []
  var absoluteStep = 0;
  for (var stageNum in json){
    for  (var stepNum in json[stageNum].steps) {
      var step = json[stageNum].steps[stepNum];

      config.completeWorkflow[absoluteStep + '-' + step.url + step.method + JSON.stringify(step.request)] = step.response;
      absoluteStep ++;
      config.completeSteps.push(step);
    }
  }

  return config;
});
