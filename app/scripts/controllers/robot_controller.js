define(["config", "controllers/base_controller", "models/robot_model",
    "app-components/scanning/robot", "lib/pubsub"
], function(config, Base, Model, robotInput, PubSub) {
  "use strict";
  var robotGroups=_.reduce(config.Robots, function(memo, robot) {
    if (_.isUndefined(memo[robot.robotType])) {
      memo[robot.robotType] = [];
    }
    memo[robot.robotType].push(robot.barcode);
    return memo;
  }, {});
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
      this._rowPromises = [];
      return this;
    }, onEndProcess: function() {
      this.model.then(_.bind(function(model) {
        model.batch.update({process: ''});
        PubSub.publish("next_process.step_controller.s2", this,
          { batch : model.batch });        
      }, this));
      PubSub.publish("disable_buttons.step_controller.s2", this.owner, {buttons: [{action: "print"}]});      
    }, onBeginProcess: function() {
      this.model.then(_.bind(function(model) {
        model.batch.update({process: this.robotInputComponent.getBarcode()});
        PubSub.publish("next_process.step_controller.s2", this,
          { batch : model.batch });        
      }, this));
      PubSub.publish("disable_buttons.step_controller.s2", this.owner, {buttons: [{action: "print"}]});
    }, setupController : function(setupData, selector) {
      var controller = this;
      
      PubSub.subscribe("printing_started.step_controller.s2", _.bind(function() {
        this._waitingPromises = null;
        this._promises = [];
      }, this));
      
      controller.selector = selector;
      this.component = { view: controller.selector(), events: {} };
      controller.model.then(function(model) {
        return model.setupModel(setupData);
      }).then(_.bind(function(model) {
        this.robotInputComponent = robotInput({
          robotGroup: robotGroups[model.config.group]
        });
        this.getComponentInterface().view.append(this.robotInputComponent.view);
        this.getComponentInterface().view.on(this.robotInputComponent.events);  
        PubSub.subscribe("start_clicked.step_controller.s2", _.bind(this.onBeginProcess, this));
        PubSub.subscribe("end_clicked.step_controller.s2", _.bind(this.onEndProcess, this));
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
