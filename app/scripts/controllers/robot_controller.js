define(["controllers/base_controller", "models/robot_model",
    "app-components/scanning/robot", "lib/pubsub"
], function(Base, Model, robotInput, PubSub) {
  "use strict";
  var robotGroups = {"ebase": ["0000000000002"], "fx": ["0000000000001"]};
  var Controller = Object.create(Base);
  _.extend(Controller,
    { register : function(callback) {
      callback("robot_controller", function() {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    }, init : function(owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.controllerFactory = factory;
      this.model = Object.create(Model).init(this, config);
      return this;
    }, setupController : function(setupData, selector) {
      var controller = this;
      controller.selector = selector;
      this.component = { view: controller.selector(), events: {} };
      controller.model.then(function(model) {
        return model.setupModel(setupData);
      }).then(_.bind(function(model) {
        if (!model.batch.robot) {
          this.robotInputComponent = robotInput({
            robotGroup: robotGroups[model.config.group]
          });
          this.getComponentInterface().view.append(this.robotInputComponent.view);
          this.getComponentInterface().view.on(this.robotInputComponent.events);
          this.getComponentInterface().view.on("scanned.robot.s2", $.ignoresEvent(_.partial(function(controller, robot) {
            controller.model.then(function(model) {
              model.batch.update({process: JSON.stringify(robot)});
              PubSub.publish("next_process.step_controller.s2", controller,
                { batch : model.batch
                });
            });
          }, this)));
          //this.getComponentInterface().view.on("done.s2", _.partial(this.next, this));
        }
      }, this));
     
      return controller;
    }, getComponentInterface : function() {
      return this.component;
    }, focus: function() {
      var controller = this;
      controller.model.then(function(model) {
        if (model.batch.robot) {
          PubSub.publish("next_process.step_controller.s2", controller,
            { batch : model.batch
            });
        } else {
          controller.selector().find('input').focus();
        }
      });
    }, release : function() {
      this.view.clear();
      return this;
    }, initialController : function() {
      // Does nothing, for the moment!
      this.owner.childDone(this, "disableBtn", this.config);
    }, childDone : function(child, action, data) {}
    });
  return Controller;
});
