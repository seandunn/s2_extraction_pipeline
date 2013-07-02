define([], function () {
  'use strict';

  var Logger = Object.create(null);

  function supports_html5_storage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  $.extend(Logger, {
    error:function(message){
      var now = new Date();
      console.error(now, Array.prototype.slice.call(message));
    },
    debug:function(message){
      var now = new Date();
      console.debug(now, Array.prototype.slice.call(arguments));
    },
    canLogLocally: supports_html5_storage() // only evaluated once!
  });

  if (!Logger.canLogLocally){
    console.warn("WARNING: this browser does not support local storage. It is not possible to log any information.");
  }

  return Logger;
});
