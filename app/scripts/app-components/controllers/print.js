define([
      'controllers/base_controller',
       'models/connected',
       'text!html_partials/_connected.html',
       'lib/pubsub'
], function(BaseController, Model, Template, PubSub) {
  'use strict';
  
  return $.extend({}, {

    init:function (owner, controllerFactory, initData) {
      this.config           = initData;
      this.owner            = owner;
      this.model            = Object.create(Model).init(this, initData);
      // Overwrite with the new implementation
      this.controllerFactory = controllerFactory;
      this.template         = _.template(Template);
      
      return this;
    },
    
   

    setupController:function (input_model, jquerySelection) {
      this.attachHandlersPrinter();
      return this;
    },
    
    attachHandlersPrinter: function() {
      this.model.addListeners({
        "outputsReady": _.bind(function() {
          this.model.outputs.then(_.bind(function(outputs) {
            this._outputsCreated = outputs;
            this.emit("printedBarcode");
          }, this));
        }, this)
      });
    },
    
    onBarcodePrintSuccess: function() {
      return this.owner.onBarcodePrintSuccess.apply(this, arguments);
    },
    
    onBarcodePrintFailure: function() {
      return this.owner.onBarcodePrintFailure.apply(this, arguments);
    },    

    readyToCreateOutputs: function() {
      return true;
    },

    print: function() {
      if (this.readyToCreateOutputs()) {
        this.emit("printingStarted");
        this.model.createOutputs(this.owner.getPrinterSelected(), true);
      }
    }
  });
});
