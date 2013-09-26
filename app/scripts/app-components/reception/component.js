define([
  'text!app-components/reception/_component.html'
  , 'app-components/manifest/maker'
  , 'app-components/manifest/reader'
  , 'app-components/user-barcode/scanner'

  // Globally included stuff added after this comment
  , 'lib/jquery_extensions'
], function (receptionPartialHtml, ManifestMaker, ManifestReader, UserScanning) {
  'use strict';

  // These are the components that need to be connected up on the UI.
  var ComponentConfig = [
    {name: "maker",  selector: ".manifest-maker",  constructor: ManifestMaker,  attach: _.partial(attachToButton, "#create-manifest-btn")},
    {name: "reader", selector: ".manifest-reader", constructor: ManifestReader, attach: _.partial(attachToButton, "#read-manifest-btn")},
    {name: "user",   selector: "#userValidation",  constructor: UserScanning,   attach: _.identity}
  ];

  return function(context) {
    var html = createHtml(context);
    html.on("s2.reception.reset_view", _.bind(context.resetS2Root, context));

    return {
      view: html,
      events: {}
    };
  };

  function createHtml(context) {
    var html  = $(_.template(receptionPartialHtml)());
    var error = function(message) { html.trigger("s2.status.error", message); };

    // Attach each of the components into the view.
    var components =
      _.chain(ComponentConfig)
       .map(_.partial(buildComponent, context))
       .map(_.partial(attachComponent, html))
       .map(function(config) { return [config.name,config]; })
       .object()
       .value();

    // Ensure that the home page is what's on the screen initially, and that if any back button
    // is pressed that it is pulled back into view and the views reset.
    var home = html.find("#homePage");
    home.swipedIn().show();
    html.on("click", ".back-button", function() {
      html.swipeIn(home);
      html.trigger("s2.reception.reset_view");
    });

    // The choice view should hide when the display is reset, and show when there is a valid user.
    var chooser     = html.find('#choice');
    var userBarcode = components["user"].element;
    html.on("s2.reception.reset_view", _.partial(swap, chooser, userBarcode));
    html.on("s2.search.user", _.partial(connect, context, _.partial(swap, userBarcode, chooser), error));
    html.on("s2.search.error", error);

    return html;
  }

  // Deals with connecting the user with the specified barcode to the system.
  function connect(context, success, error, event, barcode) {
    var user = context.config.UserData[barcode];
    if (_.isUndefined(user)) {
      error("User barcode is unrecognised");
    } else {
      context.getS2Root(user)
                .then(
                  _.partial(success, "Connected to system!"),
                  _.partial(error, "There was an issue connecting to the system with that user barcode.")
                );
    }
  }

  // Builds the component using the given configuration in the specified context.
  function buildComponent(context, config) {
    return _.extend({
      component: config.constructor(context)
    }, config);
  }

  // Attaches the given component to the specified HTML using the configuration.
  function attachComponent(html, config) {
    var element = html.find(config.selector);
    element.append(config.component.view);
    html.on(config.component.events);
    config.attach(html, element);

    return _.extend({
      element: element,
    }, config);
  }

  // Attaches a swipe to the specified button selector so that the given element
  // is swiped into view.
  function attachToButton(selector, html, element) {
    html.find(selector).click(_.bind(_.partial(html.swipeIn, element), html));
  }

  // Hides the outgoing component and shows the incoming one.
  function swap(outgoing, incoming) {
    outgoing.hide();
    incoming.show();
  }
});

