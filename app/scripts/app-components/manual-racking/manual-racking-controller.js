define([
  "controllers/base_controller",
  "app-components/manual-racking/manual-racking"
], function(BaseController, ManualRacking) {
  "use strict";

  var ManualRackingController = Object.create(BaseController);

  _.extend(ManualRackingController, {
    
    register: function(callback) { 
      return callback("manual-racking", function() {
        var manualRacking = Object.create(ManualRackingController);
        manualRacking.init.apply(manualRacking, arguments);
        return manualRacking;
      }); 
    },

    init: function(owner, factory, config) {
      this.owner = owner;
      this.factory = factory;
      this.config = config;
    },

    setupController: function(model, selector) {
      this.config.printerList = this.printerList(this.config);
      this.component = new ManualRacking({
        config: this.config,
        factory: this.factory,
        owner: this.owner
      });

      selector().html(this.component.view);
    },

    release: function() {
      this.component.release();
    }
  })

  return ManualRackingController;
});