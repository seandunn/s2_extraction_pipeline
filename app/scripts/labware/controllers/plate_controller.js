define(['labware/views/plate_view',
    'labware/controllers/base_controller'],
    function(View, BaseController) {
    'use strict';

    var plateController = function (owner, controllerFactory) {
        var labType = "plate";
        BaseController.call(this);
        this.controllerFactory = controllerFactory;
        this.init(owner, View, labType);

        return this;
    };

    plateController.prototype = new BaseController();

    return plateController;
});
