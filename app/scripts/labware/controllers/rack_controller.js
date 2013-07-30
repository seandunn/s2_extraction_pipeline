define([
       'labware/views/rack_view',
       'labware/controllers/base_controller'
], function (View,  BaseController) {
  'use strict';

  var RackController = function (owner, controllerFactory) {
    var labType = "rack";
    BaseController.call(this);
    this.controllerFactory = controllerFactory;
    this.init(owner, View, labType);

    return this;
  };

  RackController.prototype = new BaseController();

  RackController.prototype.fillWell = function (well, colour){
    this.currentView.fillWell(well,colour);
  };

  RackController.prototype.resetWells = function (){
    this.currentView.resetWells();
  };

  return RackController;
});
