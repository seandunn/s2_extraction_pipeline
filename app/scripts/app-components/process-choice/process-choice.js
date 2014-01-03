define([
  "text!app-components/process-choice/_component.html",
  "text!app-components/process-choice/_component-view.html",
  "text!app-components/process-choice/_choice.html",
  "app-components/labelling/scanning",

  // Globally included stuff added after this comment
  "lib/jquery_extensions"
], function (receptionView, componentView, choiceView, barcodeScanner) {
  "use strict";

  var reception          = _.compose($, _.template(receptionView));
  var componentContainer = _.compose($, _.template(componentView));
  var componentChoice    = _.compose($, _.template(choiceView));

  function createHtml(externalContext) {
    var context = _.extend({
      user: $.Deferred()
    }, externalContext);

    var html    = reception(context);
    var error   = function(message) { html.trigger("error.status.s2", message); };

    var tabs    = html.find(".tab-content");
    var choices = html.find(".choices");
    var home = html.find(".processes");

    // The user needs to scan themselves in before doing anything
    var userComponent = barcodeScanner({
      label: "Scan your barcode"
    });

    var userView = html.find(".user-validation");
    userView.append(userComponent.view);
    html.on(userComponent.events);

    html.on(
      "scanned.barcode.s2",
      $.haltsEvent(
        $.ignoresEvent(
          _.partial(connect, context, _.partial(swap, userView, home), error)
        )
      )
    );

    html.on("error.barcode.s2", $.ignoresEvent(error));

    // Attach each of the components into the view.
    _.chain(context.components)
     .map(_.partial(buildComponent, context))
     .each(_.partial(attachComponent, html, choices, tabs))

    return html;
  }

  // Deals with connecting the user with the specified barcode to the system.
  function connect(context, success, error, barcode) {
    context.findUser(barcode).then(
      signalUserAndAttach,
      _.partial(error, "User barcode is unrecognised")
    )
    .then(
      _.partial(success, "Connected to system!"),
      _.partial(error, "There was an issue connecting to the system with that user barcode.")
    );

    function signalUserAndAttach(user) {
      context.user.resolve(user);
      return context.getS2Root(user);
    }
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
  function attachComponent(html, choices, tabs, componentConfig) {
    var container = componentContainer(componentConfig);
    container.append(componentConfig.component.view);
    tabs.append(container);

    var choice = componentChoice(componentConfig);
    choices.append(choice);

    html.on(componentConfig.component.events);
    html.trigger("activate.s2");

    return _.extend({
      element: container,
      choice:  choice
    }, componentConfig);
  }

  // Hides the outgoing component and shows the incoming one.
  function swap(outgoing, incoming) {
    outgoing.fadeOut(function(){
      incoming.fadeIn();
    });
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

