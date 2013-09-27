// TODO: This is a placeholder for the re-racking component
define([], function() {
  return function(context) {
    var controller = context.app.controllerFactory.create(
      'lab_activities_controller',
      context.app,
      {printerList: context.printers}
    );

    return {
      view: controller.view,
      events: {}
    };
  }
});
