define([
  "text!app-components/<<componentName>>/_component.html",

  // Global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (htmlPartial) {
  "use strict"

  var template = _.compose($, _.template(htmlPartial));

  // Just a suggestion
  function createHtml(context) {
    var html = template(context);

    // Do some other things here maybe...

    return html;
  }

  return function(context) {
    var view = createHtml(context), 
        events = {};

    return {
      view:   view,
      events: events
    }
  }
});