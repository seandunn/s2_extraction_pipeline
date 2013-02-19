define([], function() {
  'use strict';

  var config = {
    apiUrl:  '', // NOT USED IN TESTING

    // Dummy out the ajax call returned by S2Ajax to test from file.
    // Returns a Deferred instead of jqXHR.
    dummyAjax: function(options){
      var requestOptions = $.extend({
        data: {
          uuid: undefined
        }
      }, options);

      // a blank options.url should default to '/'
      if (options.url.length === 0) requestOptions.url = '/';

      // We resolve the Deferred object before return so any callbacks added
      // with .done() are called as soon as they're added, which should solve 
      // testing latency issues.
      return $.Deferred().resolve({
        url:           '/something/other',
        'status':      200,
        responseTime:  750,
        responseText:  config.testJSON[requestOptions.url]
      });
    }
  };

  return config;
});
