define([
  "text!app-components/process-choice/_component.html",
  "text!app-components/process-choice/_component-view.html",
  "text!app-components/process-choice/_choice.html",
  "app-components/labelling/scanning",

  // Globally included stuff added after this comment
  "lib/jquery_extensions"
], function (processChoicePartial, componentView, choiceView, barcodeScanner) {
  "use strict";

  var $processChoiceTemplate = _.compose($, _.template(processChoicePartial));
  var componentContainer = _.compose($, _.template(componentView));
  var componentChoice    = _.compose($, _.template(choiceView));

  function createHtml(externalContext) {
    var context =  externalContext;

    var $html    = $processChoiceTemplate(context);

    var $tabs    = $html.find(".tab-content");
    var $choices = $html.find(".choices");
    var $home = $html.find(".processes");

    // Attach each of the components into the view.
    _.chain(context.components)
     .map(_.partial(buildComponent, context))
     .each(_.partial(attachComponent, $html, $choices, $tabs))

    return $html;
  }


  // Builds the component using the given configuration in the specified context.
  // A typical component config looks like:-
  // {label: "Re-racking", id: "re-racking", constructor: Reracking},
  function buildComponent(context, config) {
    var componentContext = _.omit(context, "components");

    _.extend(componentContext, config);

    return _.extend({
      component: config.constructor(componentContext)
    }, config);
  }


  // Attaches the given component to the specified HTML using the configuration.
  function attachComponent(html, $choices, $tabs, componentConfig) {
    var $container = componentContainer(componentConfig);
    $container.append(componentConfig.component.view);
    $tabs.append($container);

    var choice = componentChoice(componentConfig);
    $choices.append(choice);

    html.on(componentConfig.component.events);
    html.trigger("activate.s2");

    return _.extend({
      element: $container,
      choice:  choice
    }, componentConfig);
  }

  return function(context) {
    var html = createHtml(context);
    html.on("reset_view.reception.s2", _.bind(context.resetS2Root, context));

    return {
      name: "process-choice.s2",
      view: html,
      events: {}
    };
  };

});

