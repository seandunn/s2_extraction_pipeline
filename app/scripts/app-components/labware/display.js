//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  "text!app-components/labware/_display.html",
  "labware/presenter",  
  'app-components/labware/plate_like',
  'app-components/labware/tube_like',

  // Global namespace requirements
  "lib/jquery_extensions"
], function(View, LabwarePresenter) {
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
    var type = labware.resourceType || (labware.resource && labware.resource.resourceType);
    if (!type) {
      type = labware.expected_type;
      labware=null;
    }
    var display = Presenters[type];
    display(view, LabwarePresenter.presentResource(labware));
  }
});
