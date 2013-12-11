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
        {action: "print", title: "Print labels"  },
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

    setupController: function (model, selector) {
      var thisController = this;
      this.selector = selector;
      this.batch    = model.batch;
      this.config.user = model.user;

      this.view = new View(this, this.selector);
      this.view.renderView(this.config);

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

      PubSub.subscribe("printing_finished.step_controller.s2", printingFinishedEventHandler);
      PubSub.subscribe("printing_started.step_controller.s2", printingStartedEventHandler);
      function printingFinishedEventHandler(event, source, eventData) {
        thisController.selector().find('.component').trigger("end_process.busybox.s2");

      }
      function printingStartedEventHandler(event, source, eventData) {
        thisController.selector().find('.component').trigger("start_process.busybox.s2");
      }

      this.setupSubControllers();

      return this;
    },

    setupSubControllers: function () {
      var stepController = this;
      stepController.controllers = _.chain(stepController.config.controllers).map(function (controller, index) {
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

        return subController;
      }).value();
      stepController.activeController = stepController.controllers[0];
      stepController.activeController.initialController();

      stepController.activeController.focus();
    },

    release: function () {
      this.selector().empty().off();
      return this;
    },

    focus: function(){},

    childDone: function (child, action, data) {
      var controller = this;

      if (child === this.view) {
        // using a flag so that additional clicks
        // on a button will not be registered
        // before the button is actually disabled
        if (!controller.buttonClickedFlags[action]){
          controller.buttonClickedFlags[action] = true;
          // disable the button
          this.view.setButtonEnabled(action, false);
          var handler = this.activeController[action];
          handler && handler.apply(this.activeController, arguments);
          PubSub.publish(action + "_clicked.step_controller.s2", this);
        }
      }
      else if (action === 'done') {
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
          controller.activeController.focus();
        }
      } else if (action === 'enableBtn' || action === 'disableBtn') {
        controller.changeButtonsState(data, action === 'enableBtn');
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
