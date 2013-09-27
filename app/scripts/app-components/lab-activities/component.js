define([
  'app-components/process-choice/component'
], function(ProcessChoice) {
  return function(context) {
    return ProcessChoice(_.extend({
      components: [
        {label: "Re-racking", constructor: RackingComponent}
      ]
    }, context));
  };

  function RackingComponent(context) {
    var rackingController = context.app.controllerFactory.create("reracking_controller", context.app, context.app.config);
    return {
      view: rackingController.view,
      events: {}
    };
  }
});
