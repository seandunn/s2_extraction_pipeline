define([
       'labware/views/rack_view',
       'labware/controllers/base_controller'
], function (View,  BaseController) {
  'use strict';

  var RackController = function (owner, controllerFactory) {
    BaseController.call(this);
    this.controllerFactory = controllerFactory;
    this.init(owner, View, "rack");

    return this;
  };

  RackController.prototype = new BaseController();

  return RackController;
});
