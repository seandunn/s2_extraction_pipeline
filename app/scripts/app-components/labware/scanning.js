define([
  "text!app-components/labware/_scanning.html",
  "app-components/labelling/scanning",
  "app-components/labware/display",

  // global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function(View, LabelScanner, LabwareDisplay) {
  "use strict";

  var template = _.compose($, _.template(View));
  var events   = [
    "display.labware.s2"
  ];

  return function(context) {
    var html = template(_.extend({
      title: "&nbsp;"
    }, context));
    html.attr("tabindex", -1);

    var pickHandlers    = _.partial(pickComponentEventHandlers, events);
    var composeHandlers = _.partial(composeComponentEventHandlers, events);

    // Build the scanning component and attach it into the view
    var scanner = LabelScanner(context);
    html.find(".scanner").append(scanner.view);

    // Build the display component and attach it into the view
    var display = LabwareDisplay(context);
    html.find(".display").append(display.view);

    // Construct the components and then hook them up.
    var components = [scanner, display];
    _.chain(components)
     .map(pickHandlers)
     .each(_.bind(html.on, html))
     .value();

    // Ensure that the close button appears correctly
    var close = html.find(".close");
    close.click($.haltsEvent(function() {
      html.trigger("clear.labware.s2");
      close.hide();
    }));
    html.on("display.labware.s2", $.ignoresEvent(function(representation) {
      if (!_.isUndefined(representation)) close.show();
      html.trigger("done.s2", html);
    }));

    // Hook up our event handling: when someone scans the barcode find the labware then
    // signal this to be displayed.
    var lookupHandler = _.isUndefined(context.model) ? lookupGenericLabware : _.partial(lookupSpecificLabware, context.model);
    html.on("scanned.barcode.s2", $.haltsEvent($.ignoresEvent(_.partial(lookup, lookupHandler, context, html))));
    html.on("present.labware.s2", $.ignoresEvent(_.partial(present, html, context.representer)));

    // We have to do a bit of jiggery-pokery if we have an initial labware to display: we need to
    // display it before we are part of the UI, but also we need to re-display it when we are
    // activated.  This makes this component behave like the scan has been performed.
    if (!_.isUndefined(context.labware)) {
      present(html, context.representer, context.labware);
      components.push({
        events: {
          "activate.s2": html.eventTrigger("present.labware.s2", context.labware)
        }
      });
    }

    // Now return the view, along with any compose event handlers.
    return {
      view:   html,
      events: composeHandlers(components)
    };
  };

  function pickComponentEventHandlers(events, component) {
    return _.pick(component.events, events);
  }
  function omitComponentEventHandlers(events, component) {
    return _.omit(component.events, events);
  }

  // Composes event handlers where some of the events are handled at our level.
  function composeComponentEventHandlers(events, components) {
    return _.chain(components)
            .map(_.partial(omitComponentEventHandlers, events))
            .map(_.pairs)
            .flatten(true)
            .reject(_.compose(_.partial(_.contains, events), _.first))
            .groupBy(_.first)
            .map(function(h, e) { return [e, _.map(h, _.last)]; })
            .map(function(p) { return [p[0], $.compositeHandler.apply(undefined, p[1])]; })
            .object()
            .value();
  }

  function lookup(handler, context, html, barcode) {
    context.root().then(function(root) {
      return handler(root, barcode);
    }).then(function(labware) {
      html.trigger("present.labware.s2", [labware]);
    }, function() {
      html.trigger("error.status.s2", ["Could not find the labware with barcode '" + barcode + "'"]);
    });
  }

  function lookupSpecificLabware(model, root, barcode) {
    return root[model.pluralize()].searchByBarcode().ean13(barcode).first();
  }
  function lookupGenericLabware(root, barcode) {
    return root.findByLabEan13(barcode);
  }

  function present(html, representer, labware) {
    var representation = _.isUndefined(labware) ? undefined : representer(labware);
    html.trigger("display.labware.s2", [representation]);
  }
});
