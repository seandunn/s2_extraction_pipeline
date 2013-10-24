define([
  'app-components/labware/display'
], function(LabwareDisplay) {
  "use strict";

  return {
    register: function(callback) { return callback("labware", labwareController); }
  };

  // This is a wrapper around the labware display component so that it can be fitted into the legacy
  // MVC system.
  function labwareController(context, factory, resourceType) {
    var component = undefined;
    var view      = undefined;

    return {
      setupController: function(resource, selector) {
        // Save the view selector for later
        view = selector;

        // Create the component and then tell it the resource to display
        component = LabwareDisplay({ model: resourceType });
        component.view.on(component.events);
        component.view.trigger("display.labware.s2", resource[resourceType]);
      },

      renderView: function() {
        view().append(component.view);
      }
    };
  }
});
