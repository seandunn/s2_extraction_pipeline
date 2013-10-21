define([
  "text!app-components/labware/_scanning.html",
  "app-components/labelling/scanning",
  "app-components/labware/display",

  // global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function(View, LabelScanner, LabwareDisplay) {
  'use strict';

  var template = _.compose($, _.template(View));
  var events   = [
    "s2.labware.display",
    "s2.activate",
    "s2.deactivate",
    "focus"
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
      html.trigger("s2.labware.clear");
      close.hide();
    }));
    html.on("s2.labware.display", $.ignoresEvent(function(representation) {
      if (!_.isUndefined(representation)) close.show();
    }));

    // Hook up our event handling: when someone scans the barcode find the labware then
    // signal this to be displayed.
    var lookupHandler = _.isUndefined(context.model) ? lookupGenericLabware : _.partial(lookupSpecificLabware, context.model);
    html.on("s2.barcode.scanned", $.haltsEvent($.ignoresEvent(_.partial(lookup, lookupHandler, context, html))));
    html.on("s2.labware.present", $.ignoresEvent(_.partial(present, html, context.representer)));

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
      html.trigger("s2.labware.present", [labware]);
    }, function() {
      html.trigger("s2.status.error", ["Could not find the labware with barcode '" + barcode + "'"]);
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
    html.trigger("s2.labware.display", [representation]);
  }
});
