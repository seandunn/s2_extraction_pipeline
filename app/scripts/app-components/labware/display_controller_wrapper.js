define([
  "app-components/labware/display"
], function(LabwareDisplay) {
  "use strict";

  return {
    register: function(callback) { return callback("labware", labwareController); }
  };

  // This is a wrapper around the labware display component so that it can be fitted into the legacy
  // MVC system.
  function labwareController(context, factory, resourceType) {
    var component, view;

    return {
      setupController: function(resource, selector) {
        // Save the view selector for later
        view = selector;

        // Create the component and then tell it the resource to display
        component = new LabwareDisplay({ model: resourceType });
        component.view.on(component.events);
        component.view.trigger("display.labware.s2", resource);
      },

      renderView: function() {
        view().append(component.view);
      }
    };
  }
});