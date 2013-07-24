define(['labware/views/spin_column_view',
    'labware/controllers/base_controller'],
    function(View, BaseController) {
    'use strict';

    var spinColumnController = function (owner, controllerFactory) {
        var labType = "spinColumn";
        BaseController.call(this);
        this.controllerFactory = controllerFactory;
        this.init(owner, View, labType);

        return this;
    };

    spinColumnController.prototype = new BaseController();

    return spinColumnController;
});
