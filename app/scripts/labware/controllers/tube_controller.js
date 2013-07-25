define(['labware/views/tube_view',
    'labware/controllers/base_controller'],
    function(View, BaseController) {
    'use strict';

    var tubeController = function (owner, controllerFactory) {
        var labType = "tube";
        BaseController.call(this);
        this.controllerFactory = controllerFactory;
        this.init(owner, View, labType);

        return this;
    };

    tubeController.prototype = new BaseController();


    return tubeController;
});
