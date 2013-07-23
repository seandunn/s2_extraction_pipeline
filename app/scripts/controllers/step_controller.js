define([
  'extraction_pipeline/controllers/base_controller',
  'extraction_pipeline/views/step_view',
  'extraction_pipeline/lib/pubsub'
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

      PubSub.subscribe("s2.step_controller.enable_buttons", enableButtonsEventHandler);
      PubSub.subscribe("s2.step_controller.disable_buttons", disableButtonsEventHandler);
      PubSub.subscribe("s2.step_controller.show_buttons", showButtonsEventHandler);
      PubSub.subscribe("s2.step_controller.hide_buttons", hideButtonsEventHandler);

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

      PubSub.subscribe("s2.step_controller.next_process", nextProcessEventHandler);
      function nextProcessEventHandler(event, source, eventData) {
        // hack: reusing a bit of code defined in childDone
        thisController.childDone(source,'done',eventData);
      }

      PubSub.subscribe("s2.step_controller.printing_finished", printingFinishedEventHandler);
      PubSub.subscribe("s2.step_controller.printing_started", printingStartedEventHandler);
      function printingFinishedEventHandler(event, source, eventData) {
        thisController.selector().find('.component').trigger("s2.busybox.end_process");

      }
      function printingStartedEventHandler(event, source, eventData) {
        thisController.selector().find('.component').trigger("s2.busybox.start_process");
      }

      this.setupSubControllers();

      return this;
    },

    setupSubControllers: function () {
      var controller = this;
      controller.controllers = _.chain(controller.config.controllers).map(function (config, index) {
        var subController = controller.factory.create(config.controllerName, controller, config);
        subController.setupController({
          batch: controller.batch
        }, (function (i) {
          return function () {
            return controller.selector().find('#step' + i);
          }
        })(index + 1));

        return subController;
      }).value();
      controller.activeController = controller.controllers[0];
      controller.activeController.initialController();

      this.selector().find('.printer-select').val(controller.activeController.config.defaultPrinter);

      controller.activeController.focus();
    },

    release: function () {
      this.selector().empty().off();
      return this;
    },

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
          PubSub.publish("s2.step_controller."+action+"_clicked", this);
        }
      }
      else if (action === 'done') {
        var index = _.indexOf(this.controllers, child);
        if (index !== -1) {
          var activeSubController = controller.controllers[index + 1] || {
            config:           {defaultPrinter: null},
            previousDone:     function () {
              controller.owner.childDone.apply(controller.owner, arguments);
            },
            initialController: function () {
              // Ignore this!
            }
          };
          activeSubController.previousDone(child, action, data);
          controller.activeController = activeSubController;
          controller.activeController.initialController();
          this.selector().find('.printer-select').val(controller.activeController.config.defaultPrinter);
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
      })
    },

    changeButtonsState:function(eventData, enable){
      var thisController = this;
      var btnDetailsList = eventData.buttons || this.config.buttons;
      _.each(btnDetailsList, function (btnDetails) {
        thisController.view.setButtonEnabled(btnDetails.action, enable);
        thisController.buttonClickedFlags[btnDetails.action+"clicked"] = !enable;
      })
    }

  });

  return Controller;
});
