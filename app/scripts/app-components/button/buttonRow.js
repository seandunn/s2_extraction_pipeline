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