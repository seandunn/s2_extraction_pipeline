//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([
  "text!app-components/button/_buttonRow.html",
  "app-components/button/button",

  // Global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (htmlPartial, Button) {
  "use strict";

  var template = _.compose($, _.template(htmlPartial));

  function ButtonRow(config) {
    var $view   = template(),
        $form   = $view.find("form"),
        buttons = createButtons(config);
        
    appendButtons($form, buttons);

    return _.extend({
      view: $view
    }, buttons);
    
    function createButtons(config) {
      return _.reduce(config.buttons, _.partial(createButton, config), {});
    }

    function createButton(config, memo, buttonConfig) {
      memo[buttonConfig.action] = new Button({
        buttonConfig: buttonConfig,
        config:       config
      });
      return memo;
    }

    function appendButtons(form, buttons) {
      _.each(buttons, function(button) {
        form.append(button.view);
      });
    }

  };

  return ButtonRow;
});
