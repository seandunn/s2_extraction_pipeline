//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  "text!app-components/<<componentName>>/_component.html",

  // Global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (htmlPartial) {
  "use strict";

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
    };
  };
});
