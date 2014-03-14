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
            this.emit("renderCompleteRowDone");
          }, this));
          //_.bind(this.emit, this, "renderCompleteRowDone") 
        }, this)
        /*"outputsReady": _.bind(this.resetSubControllers, this),
        "barcodePrintSuccess": _.bind(this.owner.onBarcodePrintSuccess, this.owner),
        "barcodePrintFailure": _.bind(this.owner.onBarcodePrintFailure, this.owner)*/
      });
    },
    
    onBarcodePrintSuccess: function() {
      return this.owner.onBarcodePrintSuccess.apply(this, arguments);
    },
    
    onBarcodePrintFailure: function() {
      return this.owner.onBarcodePrintFailure.apply(this, arguments);
    },    

    /*resetSubControllers: function() {
      this.model.ready = true;
      this.setupSubControllers(true);
      this.emit("printingFinished");
    },*/
    
    /*setupSubControllers: function(reset) {
      var thisController = this;
      this.model.setupInputControllers(reset)
      .then(_.bind(function(){
        var currentController = _.find(thisController.rowControllers, function (controller) {
          return !controller.isRowComplete();
        });
        // There will not be an incomplete row returned if the entire page is complete. Therefore nothing to focus on.
        if (currentController) {
          currentController.focus();
          // we lock the other rows...
          _.chain(thisController.rowControllers).reject(function(rowController){
            return rowController === currentController;
          }).each(function(controller){
            controller.lockRow();
          });
          currentController.unlockRow();
        }
        if(thisController.model.started){
          this.emit("renderStartedProcess"); 
        }
      }, this));
      return this;
    },*/
    
    /*focus: function() {
    },

    release:function () {
      this.currentView.clear();
      return this;
    },*/

    /*checkPageComplete:function () {
      return _.all(this.rowControllers, function (controller) {
        return controller.isRowComplete();
      });
    },*/

    /*childDone:function (child, action, data) {
      if (child === this.currentView) {
        this.currentViewDone(child, action, data);
      } else {
        this.unknownDone(child, action, data);
      }
    },

    unknownDone:function (child, action, data) {
      var originator = data.origin, controller = this;
      if (action === 'inputBarcodeScanned') {
        controller.model.inputs.getByBarcode(originator, data.modelName, data.BC).done(function(resource) {
          controller.model.inputs.pull(resource);
        }).done(function() {
          controller.focus();
        });
      } else if (action === 'outputBarcodeScanned') {
        controller.model.outputs.getByBarcode(originator, data.modelName, data.BC).done(function(resource) {
          controller.model.outputs.pull(resource);
        }).done(function() {
          controller.focus();
        });
      }
    },*/
    
    readyToCreateOutputs: function() {
      //return !this.model.started;
      return true;
    },

    /*initialController: function() {
      this.model.previous = true;
      this.emit("printReady");
    },*/

    /*previousDone: function() {
      this.model.previous = true;
    },*/

    print: function() {
      if (this.readyToCreateOutputs()) {
        this.emit("printingStarted");
        this.model.createOutputs(this.owner.getPrinterSelected(), true);
      }
    }
  });
});
