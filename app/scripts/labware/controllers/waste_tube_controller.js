define(['labware/views/waste_tube_view',
  'labware/controllers/base_controller'],
  function (View, BaseController) {
    'use strict';

    var tubeController = function (owner, controllerFactory) {
      var labType = "wasteTube";
      BaseController.call(this);
      this.controllerFactory = controllerFactory;
      this.init(owner, View, labType);

      return this;
    };

    tubeController.prototype = new BaseController();

    /* Sets up the controller
     *
     *
     * Arguments
     * ---------
     * jquerySelection: The jQuery selection for the view
     *
     *
     * Returns
     * -------
     * this
     */
    tubeController.prototype.setupController = function (inputModel, jquerySelection) {
      this.setupPlaceholder(jquerySelection);
      this.setupView();
      this.renderView();

      return this;
    };

    tubeController.prototype.getAliquotType = function () {
      var type = '';

      if (this.model && this.model.hasOwnProperty('tube')) {
        if (this.model.tube.aliquots.length > 0) {
          type = this.model.tube.aliquots[0].type;
        }
      }

      return type;
    }

    return tubeController;
  });
