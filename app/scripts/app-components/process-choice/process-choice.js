define([
    'text!app-components/process-choice/_component.html'
  , 'text!app-components/process-choice/_component-view.html'
  , 'text!app-components/process-choice/_choice.html'
  , 'app-components/labelling/scanning',

  // Globally included stuff added after this comment
  , 'lib/jquery_extensions'
], function (receptionView, componentView, choiceView, BarcodeScanner) {
  'use strict';

  var reception          = _.compose($, _.template(receptionView));
  var componentContainer = _.compose($, _.template(componentView));
  var componentChoice    = _.compose($, _.template(choiceView));

  return function(context) {
    var html = createHtml(context);
    html.on("s2.reception.reset_view", _.bind(context.resetS2Root, context));

    return {
      view: html,
      events: {}
    };
  };

  function createHtml(externalContext) {
    var context = _.extend({
      user: $.Deferred()
    }, externalContext);

    var html  = reception(context);
    var error = function(message) { html.trigger("s2.status.error", message); };

    var choices = html.find("#choice");

    // The user needs to scan themselves in before doing anything
    var userComponent = BarcodeScanner({
      label: "Scan your barcode",
      model: "user"
    });
    var userView = html.find("#userValidation");
    userView.append(userComponent.view);
    html.on(userComponent.events);

    // The choice view should hide when the display is reset, and show when there is a valid user.
    html.on("s2.reception.reset_view", _.partial(swap, choices, userView));
    html.on("s2.barcode.scanned.user", _.partial(connect, context, _.partial(swap, userView, choices), error));
    html.on("s2.barcode.error", $.ignoresEvent(error));

    // Attach each of the components into the view.
    _.chain(context.components)
     .map(_.partial(buildComponent, context))
     .map(_.partial(attachComponent, html, choices))
     .value();

    // Ensure that the home page is what's on the screen initially, and that if any back button
    // is pressed that it is pulled back into view and the views reset.
    var home = html.find("#homePage");
    home.swipedIn().show();
    html.on("click", ".back-button", function() {
      html.swipeIn(home);
      html.trigger("s2.reception.reset_view");
    });

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
  function buildComponent(context, config) {
    return _.extend({
      component: config.constructor(context)
    }, config);
  }


  // Attaches the given component to the specified HTML using the configuration.
  function attachComponent(html, choices, config) {
    var container = componentContainer(config);
    container.append(config.component.view);
    html.append(container);

    var choice = componentChoice(config);
    choice.click(_.bind(_.partial(html.swipeIn, container), html));
    choices.append(choice);

    html.on(config.component.events);
    html.trigger("s2.activate");

    return _.extend({
      element: container,
      choice:  choice
    }, config);
  }

  // Hides the outgoing component and shows the incoming one.
  function swap(outgoing, incoming) {
    outgoing.hide();
    incoming.show();
  }
});

