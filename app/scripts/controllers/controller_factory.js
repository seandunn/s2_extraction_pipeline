define([
  // The top level controllers (typically these get re-used)
  'controllers/row_controller',
  'controllers/row_bed_controller',
  'controllers/step_controller',
  'controllers/scan_barcode_controller',
  'controllers/labware_controller',
  'controllers/connected_controller',

  // Controllers that add extra behaviour, for some reason
  'controllers/kit_controller',
  'controllers/robot_controller',
  'controllers/rack_scan_controller',
  'controllers/selection_page_controller',
  'default/default_controller',
  'controllers/volume_control_controller',
  'controllers/summary_page_controller',
  'controllers/file_generator_controller',

  // Component wrapping controllers
  'app-components/labware/display_controller_wrapper',
  'app-components/lysing/lysing_controller_wrapper',
  'app-components/imager/imager_controller'
], function() {
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

  ControllerFactory.prototype.controllers = _.reduce(arguments, function(controllers, controller) {
    controller.register(function(name, method) { controllers[name] = method; });
    return controllers;
  }, {});

  // Function can take variable number of parameters, passing them onto the constructor function
  // for the named controller.  It is here to ensure that the first two arguments are always the
  // for the named controller.  It is here to ensure that the first two arguments are always the
  // owner and the factory with which the controller was registered.
  ControllerFactory.prototype.create = function(name, owner) {
    var constructor = _.partial((this.controllers[name] || this.controllers.default), owner, this);
    return $.extend(
      constructor.apply(null, _.chain(arguments).drop(2).value()), {
        className: name,
        localUuid: _.uniqueId()
      }
    );
  };

  ControllerFactory.prototype.createLabwareSubController = function(owner, type) {
    return this.create("labware", owner, type);
  };

  return ControllerFactory;
});
