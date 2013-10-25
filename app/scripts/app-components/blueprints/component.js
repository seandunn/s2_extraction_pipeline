define([], function() {
  "use strict"

  // Just a suggestion
  function createHtml(context) {
    return {};
  }

  return function(context) {
    // Add something to these guys
    var view = createHtml(context), 
        events = {};

    return {
      view:   view,
      events: events
    }
  }
});