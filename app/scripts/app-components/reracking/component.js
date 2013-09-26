// TODO: This is a placeholder for the re-racking component
define([], function() {
  return function(context) {
    var controller = context.controllerFactory.create(
      'lab_activities_controller',
      context,
      {printerList: context.config.printers}
    );

    return {
      view: controller.view,
      events: {}
    };
  }
});
