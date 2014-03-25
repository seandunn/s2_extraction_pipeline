define([
      'controllers/base_controller',
       'models/connected',
       'text!html_partials/_connected.html',
       'lib/pubsub'
], function(BaseController, Model, Template, PubSub) {
  'use strict';

  var Controller = Object.create(BaseController);

  $.extend(Controller, {
    register:function (callback) {
      callback('connected_controller', function (owner, factory, initData) {
        return Object.create(Controller).init(owner, factory, initData);
      });
    },

    init:function (owner, controllerFactory, initData) {
      this.config           = initData;
      this.owner            = owner;
      this.model            = Object.create(Model).init(this, initData);
      this.rowControllers    = [];
      this.controllerFactory = controllerFactory;
      this.template         = _.template(Template);
      
      return this;
    },
    
   

    setupController:function (input_model, jquerySelection) {
      this.jquerySelection = jquerySelection;
      // send busy message
      this.jquerySelection().trigger("start_process.busybox.s2");
      this.model.setBatch(input_model.batch)
          .then(_.bind(function(){
            this.jquerySelection().trigger("end_process.busybox.s2");
          }, this)).fail(_.bind(function(error){
            PubSub.publish("error.status.s2", this, error);
            this.jquerySelection().trigger("end_process.busybox.s2");
          }, this)).then(_.bind(function(){
            // TODO:
            // This 96 MUST be read from pipeline config
            this.jquerySelection().html(this.template({nbRow:96}));
            this.setupSubControllers();
          }, this));
      this.attachHandlers();
      return this;
    },
    
    attachHandlers: function() {
      this.model.addListeners({
        "outputsReady": _.bind(this.resetSubControllers, this),
        "successfulOperation": _.bind(this.operateOnNextRowUnset, this),
        "startOperation": _.bind(this.transferStarted, this),
        "completeOperation": _.bind(this.transferCompleted, this),
        "barcodePrintSuccess": _.bind(this.owner.onBarcodePrintSuccess, this.owner),
        "barcodePrintFailure": _.bind(this.owner.onBarcodePrintFailure, this.owner),
        "inputRemoved": _.bind(this.onInputRemoved, this),
        "outputRemoved": _.bind(this.onOutputRemoved, this),
        "completedRow": _.bind(this.onCompletedRow, this),
        "inputBarcodeScanned": _.bind(this.onInputBarcodeScanned, this),
        "outputBarcodeScanned": _.bind(this.onOutputBarcodeScanned, this)
      });
    },
    
    onCompletedRow: function(childController) {
      this.model.operate('row', [childController]);
      if (this.checkPageComplete()) {
        this.emit("renderCompleteRowDone");
      }
    },
    
    onBarcodePrintSuccess: function() {
      return this.owner.onBarcodePrintSuccess.apply(this, arguments);
    },
    
    onBarcodePrintFailure: function() {
      return this.owner.onBarcodePrintFailure.apply(this, arguments);
    },    

    resetSubControllers: function() {
      this.model.ready = true;
      this.setupSubControllers(true);
      this.emit("printingFinished");
    },
    
    setupSubControllers: function(reset) {
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
    },
    
    focus: function() {
    },

    release:function () {
      this.currentView.clear();
      return this;
    },

    checkPageComplete:function () {
      return _.all(this.rowControllers, function (controller) {
        return controller.isRowComplete();
      });
    },

    childDone:function (child, action, data) {
      if (child === this.currentView) {
        this.currentViewDone(child, action, data);
      } else {
        this.unknownDone(child, action, data);
      }
    },

    onInputBarcodeScanned: function(controller, data) {
      var originator = data.origin, controller = this, promise = data.promise;
      
      this.model.inputs.getByBarcode(originator, data.modelName, data.BC)
      .then(promise.resolve, promise.reject)
      .done(_.bind(function(resource) {
        this.model.inputs.pull(resource);
      }, this)).done(_.bind(function() {
        this.focus();
      }, this));      
    },
    
    onOutputBarcodeScanned: function(controller, data) {
      var originator = data.origin, controller = this, promise = data.promise;
      
      this.model.outputs.getByBarcode(originator, data.modelName, data.BC)
        .then(promise.resolve, promise.reject).done(_.bind(function(resource) {
          this.model.outputs.pull(resource);
        }, this)).done(_.bind(function() {
          this.focus();
        }, this));      
    },
    
    onInputRemoved: function() {
      this.model.inputs.push(data.resource);
      this.emit("inputRemoved");
    },
    onOutputRemoved: function() {
      this.model.outputs.push(data.resource);
      this.emit("outputRemoved");
    },
    transferStarted: function() {
      if (_.isUndefined(this.model.started)) {
        this.model.started = true;
        this.emit("processBegin")
      }
      this.emit("transferStarted");
    },
    
    transferCompleted: function() {
      this.model.behaviours.done.transfer(_.bind(function() {
        this.owner.childDone(this, "done", { batch:this.model.batch });
      }, this));
      
      this.emit("transferCompleted");      
      if (this.checkPageComplete()) {
        this.emit("processFinished");        
      }
    },
    
    operateOnNextRowUnset: function(successfulRowControllers) {
      // locks the rowControllers which have successfully completed their operations
      _.each(successfulRowControllers, function(controller){
        controller.lockRow();
      });

      // find the index of the last rowController which has successfully completed its operations
      var lastIndex = -1;
      _.each(this.rowControllers,function(rowController, index){
        if (_.contains(successfulRowControllers,rowController)){
          lastIndex = lastIndex < index ? index : lastIndex;
        }
      });
      // if there is at least one controller after...
      if (lastIndex+1 < this.rowControllers.length){
        // we unlock it
        this.rowControllers[lastIndex+1].unlockRow();
      }
    },
    
    readyToCreateOutputs: function() {
      return !this.model.started;
    },

    currentViewDone: function() {
    },

    initialController: function() {
      this.model.previous = true;
      this.emit("printReady");
    },

    previousDone: function() {
      this.model.previous = true;
    },

    print: function() {
      if (this.readyToCreateOutputs()) {
        this.emit("printingStarted");
        this.model.createOutputs(this.owner.getPrinterSelected());
      }
    },

    next:  function(){
      // TODO: This shouldn't make you login again
      window.location.reload();
    },

    start: _.partial(actionOperation, "start"),

    end:   _.partial(actionOperation, "end")
  });
  return Controller;

  function actionOperation(action) {
    if (this.checkPageComplete()) {
      this.model.operate(action, this.rowControllers);
      this.model.behaviours.done[action](_.bind(function() {
        this.owner.childDone(this, "done", {
          batch: this.model.batch,
          user: this.owner.config.login
        });
      }, this));
    }
  }
});
