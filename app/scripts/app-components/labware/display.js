define([
  "text!app-components/labware/_display.html",
  'app-components/labware/plate_like',
  'app-components/labware/tube_like',

  // Global namespace requirements
  "lib/jquery_extensions"
], function(View) {
  'use strict';

  var template = _.compose($, _.template(View));

  var Presenters =
    _.chain(arguments)
     .drop(1).initial(1)
     .reduce(
      function(m, p) { return _.extend(m, p); },
      {unspecified: UnspecifiedLabwarePresenter}
     )
     .value();

  return function(context) {
    var display  = Presenters[context.model || "unspecified"];
    var view     = template();
    var resource = view.find(".resource");
    return {
      view: view,
      events: {
        "display.labware.s2": $.ignoresEvent(_.partial(display, resource)),
        "clear.labware.s2": $.ignoresEvent(_.bind(resource.empty, resource))
      }
    };
  };

  function UnspecifiedLabwarePresenter(view, labware) {
    if (_.isUndefined(labware)) return;
    var type = labware.resourceType || (labware.resource && labware.resource.resourceType) ||
      labware.expected_type;
    var display = Presenters[type];
    display(view, labware);
  }
});
