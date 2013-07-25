define(['labware/views/gel_view',
    'labware/controllers/base_controller'],
    function (View, BaseController) {
    'use strict';

    var gelController = function (owner, controllerFactory) {
        var labType = "gel";
        BaseController.call(this);
        this.controllerFactory = controllerFactory;
        this.init(owner, View, labType);

        return this;
    };

    gelController.prototype = new BaseController();

    return gelController;
});
