//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  'controllers/base_controller',
  'views/step_view',
  'lib/pubsub'
], function (Base, View, PubSub) {
  'use strict';

  var Controller = Object.create(Base);

  _.extend(Controller, {
    register: function (callback) {
      callback('step_controller', function () {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.factory = factory;

      this.config = config;
      this.config.buttons = this.config.buttons || [
        {action: "print", title: "Print labels", icon: "icon-print"  },
        {action: "start", title: "Start process" },
        {action: "end",   title: "End process"   },
        {action: "next",  title: "Next"          }
      ];

      this.buttonClickedFlags = _.reduce(this.config.buttons, function (memo, button) {
        memo[button.action] = false;
        return memo;
      }, {});

      this.config.printerList = this.printerList(config);

      return this;
    },
    getSelectedPrinter: function() {
      this.view.getSelectedPrinter();
    },

    setupController: function (model, selector) {
      var thisController = this;
      this.selector = selector;
      this.batch    = model.batch;
      this.config.user = model.user;

      this.view = new View(this, this.selector);
      this.view.renderView(this.config);
      
      this.view.on("clickButton", _.bind(this.onClickStepButton, this));

      PubSub.subscribe("enable_buttons.step_controller.s2", enableButtonsEventHandler);
      PubSub.subscribe("disable_buttons.step_controller.s2", disableButtonsEventHandler);
      PubSub.subscribe("show_buttons.step_controller.s2", showButtonsEventHandler);
      PubSub.subscribe("hide_buttons.step_controller.s2", hideButtonsEventHandler);

      function enableButtonsEventHandler(event, source, eventData) {
        thisController.changeButtonsState(eventData, true);
      }
      function disableButtonsEventHandler(event, source, eventData) {
        thisController.changeButtonsState(eventData, false);
      }
      function showButtonsEventHandler(event, source, eventData) {
        thisController.changeButtonsVisibility(eventData, true);
      }
      function hideButtonsEventHandler(event, source, eventData) {
        thisController.changeButtonsVisibility(eventData, false);
      }

      PubSub.subscribe("next_process.step_controller.s2", nextProcessEventHandler);
      function nextProcessEventHandler(event, source, eventData) {
        // hack: reusing a bit of code defined in childDone
        thisController.childDone(source,'done',eventData);
      }

      PubSub.subscribe("printing_started.step_controller.s2", printingStartedEventHandler);
      function printingStartedEventHandler(event, source, eventData) {
      }

      this.setupSubControllers();

      return this;
    },
    onPrintingStarted: function() {
      this.view.toggleWaitingPage(true);
    },
    onPrintingFinished: function() {
      this.view.toggleWaitingPage(false);
      this.emit("printingFinished");
    },
    onBarcodePrintSuccess: function() {
      PubSub.publish("message.status.s2", this, {message: 'Barcode labels printed'});
      this.onPrintingFinished();
      this.disableBtn("print");
    },
    onBarcodePrintFailure: function() {
      PubSub.publish("error.status.s2", this, {message: 'Barcode labels could not be printed'});
      this.enableBtn("print");
    },
    enableBtn: function(actionName) {
      this.changeButtonsState({buttons:[{action: actionName}]}, true);
    },
    disableBtn: function(actionName) {
      this.changeButtonsState({buttons:[{action: actionName}]}, false);
    },
    onProcessBegin: function() {
      this.disableBtn("print");
      this.disableBtn("start");
      this.enableBtn("end");
    },
    onTransferStarted: function() {
      PubSub.publish("message.status.s2", this, {message: 'Transfer started'});
      this.enableBtn("end");
    },
    onTransferCompleted: function() {
      PubSub.publish("message.status.s2", this, {message: 'Transfer completed'});
      this.disableBtn("end");
    },
    onProcessFinished: function() {
      this.enableBtn("next");      
    },
    onRenderCompleteRow: function() {
      this.enableBtn("start");
    },
    onRenderStartedProcess: function() {
      this.disableBtn("print");
      this.enableBtn("end");
    },
    onInputRemoved: function() {
      this.disableBtn("start");
    },
    onOutputRemoved: function() {
      this.disableBtn("start");
    },
    onValidatedFile: function() {
      this.enableBtn("print");
      this.enableBtn("end");
    },
    onPrintReady: function() {
      this.enableBtn("print");      
    },
    setupSubControllers: function () {
      var stepController = this;
      stepController.controllers = _.chain(stepController.config.controllers).map(_.bind(function (controller, index) {
        var subController = stepController.factory.create(controller.controllerName, stepController, controller);
        subController.setupController({
          batch: stepController.batch,
          user:  stepController.config.user,
          initialLabware: stepController.config.initialLabware
        }, (function (i) {
          return function () {
            return stepController.selector().find('#step' + i);
          };
        })(index + 1));
        
        subController.addListeners({
          // Processes (Connected)
          "processBegin": _.bind(this.onProcessBegin, this),
          "transferStarted": _.bind(this.onTransferStarted, this),
          "transferCompleted": _.bind(this.onTransferCompleted, this),          
          "processFinished": _.bind(this.onProcessFinished, this),
          // These events should be substituted or replanned in a future refactor
          "validatedFile": _.bind(this.onValidatedFile, this),
          "renderStartedProcess": _.bind(this.onRenderStartedProcess, this),
          "renderCompleteRowDone": _.bind(this.onRenderCompleteRow, this),
          "inputRemoved": _.bind(this.onInputRemoved, this),
          "outputRemoved": _.bind(this.onOutputRemoved, this),
          "printReady": _.bind(this.onPrintReady, this),
          //
          "controllerDone": _.bind(this.emit, this, "controllerDone")
        });
        
        return subController;
      }, this)).value();
      stepController.activeController = stepController.controllers[0];
      
      stepController.activeController.initialController();
      stepController.activeController.focus();
    },

    release: function () {
      this.view.release();
      return this;
    },

    focus: function(){},
    getPrinterSelected: function() {
      return this.view.getPrinterSelected();
    },
    onClickStepButton: function(action) {
      // TODO: From this method, we cannot know which method we are calling
      // from other controllers. Metaprogramming is not justified in this case. 
      
      // using a flag so that additional clicks
      // on a button will not be registered
      // before the button is actually disabled
      if (!this.buttonClickedFlags[action]){
        this.buttonClickedFlags[action] = true;
        // disable the button
        this.view.setButtonEnabled(action, false);
        var handler = this.activeController[action];
        if (!_.isUndefined(handler)) {
          handler.apply(this.activeController);
        }
        PubSub.publish(action + "_clicked.step_controller.s2", this);
      }
    },

    childDone: function (child, action, data) {
      var controller = this;

      if (action === 'done') {
        var index = _.indexOf(this.controllers, child);
        if (index !== -1) {
          var activeSubController = controller.controllers[index + 1] || {
            className: 'Step Controller Subcontroller',
            config:           {defaultPrinter: null},
            previousDone:     function () {
              controller.owner.childDone.apply(controller.owner, arguments);
            },
            initialController: function () {
              // Ignore this!
            },
            focus: function() {}
          };
          activeSubController.previousDone(child, action, data);
          controller.activeController = activeSubController;
          controller.activeController.initialController();
          this.enableBtn("print");
          controller.activeController.focus();
        }
      }
      else if (action === 'showBtn' || action === 'hideBtn') {
        controller.changeButtonsVisibility(data, action === 'showBtn');
      }
      else {
        this.owner.childDone(child, action, data);
      }
    },

    changeButtonsVisibility: function (action, data) {
      var btnDetailsList;
      var thisController = this;
      btnDetailsList = data.buttons || this.config.buttons;
      _.each(btnDetailsList, function (btnDetails) {
        thisController.view.setButtonVisible(btnDetails.action, visible);
      });
    },

    changeButtonsState:function(eventData, enable){
      var thisController = this;
      var btnDetailsList = eventData.buttons || this.config.buttons;
      _.each(btnDetailsList, function (btnDetails) {
        thisController.view.setButtonEnabled(btnDetails.action, enable);
        thisController.buttonClickedFlags[btnDetails.action+"clicked"] = !enable;
      });
    }

  });

  return Controller;
});
