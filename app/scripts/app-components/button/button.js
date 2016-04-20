//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([
  "text!app-components/button/_button.html",
  "lib/mixins/jquery_proxies_mixin",

  // Global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (buttonPartial, proxies) {
  "use strict";

  var buttonTemplate = _.compose($, _.template(buttonPartial));

  return function(args) {
    var buttonOptions = templateArgs(args["buttonConfig"], args["config"]),
        $view = buttonTemplate(buttonOptions);

    $view.on("click", function(e) { e.preventDefault(); })

    return _.extend({
      view: $view
    }, proxies($view));

    function templateArgs(buttonConfig, config) {
      return _.extend({}, buttonConfigDefaults(buttonConfig), printerConfigDefaults(config));
    }

    function buttonConfigDefaults(config) {
      return {
        action: config["action"] || "",
        icon:   config["icon"] || "",
        title:  config["title"] || ""
      };
    }

    function printerConfigDefaults(config) {
      return {
        printerList: config["printerList"] || "",
        defaultPrinter: config["defaultPrinter"] || ""
      };
    }
  };
});
