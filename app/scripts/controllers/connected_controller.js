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
      var thisController = this;
      thisController.jquerySelection().trigger("start_process.busybox.s2");
      this.model.setBatch(input_model.batch)
          .then(function(){
            thisController.jquerySelection().trigger("end_process.busybox.s2");
          }).fail(function(error){
            PubSub.publish("error.status.s2", thisController, error);
            thisController.jquerySelection().trigger("end_process.busybox.s2");
          }).then(function(){
            thisController.jquerySelection().html(thisController.template({nbRow:12}));
            thisController.setupSubControllers();
          });
      return this;
    },

    setupSubControllers: function(reset) {
      var thisController = this;
      this.model.setupInputControllers(reset)
          .then(function(){
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
              thisController.owner.childDone(this, "disableBtn", {buttons:[{action:"print"}]});
              thisController.owner.childDone(this, "enableBtn", {buttons:[{action:"end"}]});
            }
          });
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
      } else if (child === this.model) {
        this.modelDone(child, action, data);
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
      } else if (action === 'inputRemoved') {
        this.model.inputs.push(data.resource);
        controller.owner.childDone(controller, "disableBtn", {buttons:[{action:"start"}]});
      } else if (action === 'outputRemoved') {
        this.model.outputs.push(data.resource);
        controller.owner.childDone(controller, "disableBtn", {buttons:[{action:"start"}]});
      } else if (action === 'completed') {
        this.rowDone(child, action, data);
      }
    },

    rowDone: function(child, action, data) {
      if (action === 'completed') {
        this.model.operate('row', [child]);
        if (this.checkPageComplete()) {
          this.owner.childDone(this, "enableBtn", {buttons:[{action:"start"}]});
        }
      }
    },

    modelDone: function(child, action, data) {
      if (action === 'outputsReady') {
        this.model.ready = true;
        this.setupSubControllers(true);
        PubSub.publish("printing_finished.step_controller.s2", this);

      } else if (action === "barcodePrintSuccess") {

        PubSub.publish("message.status.s2", this, {message: 'Barcode labels printed'});
        PubSub.publish("printing_finished.step_controller.s2", this);
        PubSub.publish("printing_finished.barcodePrintSuccess", this);
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"print"}]});

      } else if (action === "barcodePrintFailure") {

        PubSub.publish("error.status.s2", this, {message: 'Barcode labels could not be printed'});
        PubSub.publish("printing_finished.step_controller.s2", this);
        this.owner.childDone(this, "enableBtn", {buttons:[{action:"print"}]});

      } else if (action === "startOperation") {

        this.model.started = true;
        PubSub.publish("message.status.s2", this, {message: 'Transfer started'});
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"start"}]});
        this.owner.childDone(this, "enableBtn", {buttons:[{action:"end"}]});

      } else if (action === "completeOperation") {

        PubSub.publish("message.status.s2", this, {message: 'Transfer completed'});
        this.owner.childDone(this, "disableBtn", {buttons:[{action:"start"}]});
        if (this.checkPageComplete()) {
          this.owner.childDone(this, "enableBtn", {buttons:[{action:"next"}]});
        }

        var that = this;
        this.model.behaviours.done.transfer(function() {
          that.owner.childDone(that, "done", { batch:that.model.batch });
        });

      } else if (action === "successfulOperation") {
        // locks the rowControllers which have successfully completed their operations
        _.each(data, function(controller){
          controller.lockRow();
        });

        // find the index of the last rowController which has successfully completed its operations
        var lastIndex = -1;
        _.each(this.rowControllers,function(rowController, index){
          if (_.contains(data,rowController)){
            lastIndex = lastIndex < index ? index : lastIndex;
          }
        });
        // if there is at least one controller after...
        if (lastIndex+1 < this.rowControllers.length){
          // we unlock it
          this.rowControllers[lastIndex+1].unlockRow();
        }
      }
    },

    readyToCreateOutputs: function() {
      return !this.model.started;
    },

    currentViewDone: function(child, action, data) {
    },

    initialController: function() {
      this.model.previous = true;
      this.owner.childDone(this, "enableBtn", {buttons:[{action:"print"}]});
    },

    previousDone: function(child, action, data) {
      this.model.previous = true;
    },

    print: function(child, action, data) {
      if (this.readyToCreateOutputs()) {
        PubSub.publish("printing_started.step_controller.s2", this);
        this.model.createOutputs(data);
      }
    },

    next:  function(child, action, data){
      var controller = this;
      this.model.behaviours.done[action](
        function(){ controller.owner.childDone(controller, 'done') },
        function(){ eventHandler.call(controller, child, action, data); }
      )
    },

    start: eventHandler,

    end:   eventHandler
  });
  return Controller;

  function eventHandler(child, action, data) {
    if (this.checkPageComplete()) {
      var that = this;
      that.model.operate(action, that.rowControllers);
      that.model.behaviours.done[action](function() {
        that.owner.childDone(that, "done", {
          batch: that.model.batch,
          user: that.model.user
        });
      });
    }
  }
});
