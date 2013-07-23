define([
  'labware/controllers/tube_controller',
  'labware/controllers/spin_column_controller',
  'labware/controllers/waste_tube_controller',
  'labware/controllers/rack_controller',
  'labware/controllers/gel_controller',
  'labware/controllers/plate_controller',

  // Add new controllers after this point for automatic registration

  // The top level controllers (typically these get re-used)
  'extraction_pipeline/controllers/row_controller',
  'extraction_pipeline/controllers/step_controller',
  'extraction_pipeline/controllers/scan_barcode_controller',
  'extraction_pipeline/controllers/labware_controller',
  'extraction_pipeline/controllers/connected_controller',

  // Controllers that add extra behaviour, for some reason
  'extraction_pipeline/controllers/kit_controller',
  'extraction_pipeline/controllers/rack_scan_controller',
  'extraction_pipeline/controllers/reracking_controller',
  'extraction_pipeline/controllers/selection_page_controller',
  'extraction_pipeline/default/default_controller',
  'extraction_pipeline/controllers/volume_control_controller',
  'extraction_pipeline/controllers/reception_controller',
  'extraction_pipeline/controllers/lab_activities_controller',
  'extraction_pipeline/controllers/manifest_maker_controller',
  'extraction_pipeline/controllers/manifest_reader_controller',
  'extraction_pipeline/controllers/summary_page_controller'
], function(TubeController, SpinColumnController, WasteTubeController, RackController, GelController, PlateController) {
  'use strict';

  var ControllerFactory = function () {
    /* Construct an instance of ControllerFactory
     *
     * This is an implementation of the AbstractFactory pattern. The
     * intention of using the pattern is to allow controllers that create
     * partial controllers to have a mock implementation in the testing. Otherwise
     * views are likely to be created in the testing, which will likely mess about
     * with the Jasmine testing library.
     */
    return this;
  };

  ControllerFactory.prototype.controllers = _.chain(arguments).drop(6).reduce(function(controllers, controller) {
    controller.register(function(name, method) { controllers[name] = method; });
    return controllers;
  }, {
    createSpinColumnController: function(owner) { return new SpinColumnController(owner, this); },
    createTubeController:       function(owner) { return new TubeController(owner, this); },
    createWasteTubeController:  function(owner) { return new WasteTubeController(owner, this); },
    createGelController:        function(owner) { return new GelController(owner, this); },
    createRackController:       function(owner) { return new RackController(owner, this); },
    createPlateController:      function(owner) { return new PlateController(owner, this); }
  }).value();

  // Function can take variable number of parameters, passing them onto the constructor function
  // for the named controller.  It is here to ensure that the first two arguments are always the
  // for the named controller.  It is here to ensure that the first two arguments are always the
  // owner and the factory with which the controller was registered.
  ControllerFactory.prototype.create = function(name, owner) {
    var constructor = this.controllers[name] || this.controllers.default;
    return $.extend(
      _.partial(constructor, owner, this).apply(null, _.chain(arguments).drop(2).value()),
      { controller_type_name_debug: name }
    );
  };

  ControllerFactory.prototype.createLabwareSubController = function(owner, type) {
    switch (type) {
      case 'tube':        return this.controllers.createTubeController(owner);       break;
      case 'spin_column': return this.controllers.createSpinColumnController(owner); break;
      case 'waste_tube':  return this.controllers.createWasteTubeController(owner);  break;
      case 'tube_rack':   return this.controllers.createRackController(owner);       break;
      case 'gel':         return this.controllers.createGelController(owner);        break;
      case 'plate':       return this.controllers.createPlateController(owner);      break;
      default:            debugger;
    }
  };

  return ControllerFactory;
});
