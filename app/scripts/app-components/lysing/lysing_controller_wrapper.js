define([
  "app-components/lysing/lysing"
], function(Lysing) {
  "use strict";

  return {
    register: function(callback) { return callback("lysing", lysingController); }
  };

  function lysingController(owner, factory, config) {
    // Build the lysing component now, because we can, but don't attach it to anything useful for
    // the moment as we're not on the screen at the moment.
    var component = Lysing({
      processTitle: config.processTitle,
      root: _.constant(owner.rootPromise),
      input: {
        model:   config.input.model.singularize(),
        role:    config.input.role,
        labware: config.initialLabware
      },
      output: {
        model:       config.output[0].model.singularize(),
        role:        config.output[0].role,
        aliquotType: "NA+P",
        purpose:     "Stock"
      },
      printers: owner.config.printers
    });

    return {
      setupController: function(model, selector) {
        // Attach the component to the view and signal the resource to be displayed.  When it
        // signals that it has completed it's work we can simulate the childDone behaviour.
        var view = selector();
        view.html(component.view).on(component.events).trigger("s2.activate");

        var controller = this;
        view.on("s2.done", $.stopsPropagation($.ignoresEvent(function(view) {
          if (view === component.view[0]) owner.childDone(controller, "done", {});
          return true;
        })));
        return this;
      },

      release: function() {
        // There isn't much to do here!
      }
    };
  }
});
