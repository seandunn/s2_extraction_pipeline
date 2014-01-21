define(["controllers/base_controller", "models/robot_model",
    "app-components/scanning/robot", "lib/pubsub"
], function(Base, Model, robotInput, PubSub) {
  "use strict";
  var robotGroups = {"ebase": ["0000000000002"], "fx": ["0000000000001", "0000000010468"], "nx": ["0000000000003"]};
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
    }, onAllInputComplete: function() {
      return;
      var data = arguments;
      this.model.then(_.bind(function(model) {
        var processList;
        if (!model.batch.rawJson.batch.process) {
          processList = [];
        } else {        
          processList = JSON.parse(model.batch.rawJson.batch.process);
        }
        _.each(processList, function(node) { node.selected=false;});
        if (!(_.find(processList, _.bind(function(robotNode) { 
          return robotNode.robotBarcode === this.robotInputComponent.getBarcode(); 
        }, this)))) {
          processList.push({
            robotBarcode: this.robotInputComponent.getBarcode(),
            bedsConfig: data,
            selected: true
          });
        }
        model.batch.update({process: JSON.stringify(processList) });
        PubSub.publish("next_process.step_controller.s2", this,
          { batch : model.batch });
      }, this));      
      PubSub.publish("enable_buttons.step_controller.s2", this.owner, {buttons: [{action: "start"}]});
      //this.owner.childDone(controller, "completed", data);
    }, onBeginProcess: function() {
      $.when.apply(this, this._promises).then(_.bind(this.onAllInputComplete, this));
    }, onSetupRow: function(event, promiseWhenFinish) {
      // I do not know how many rows will be created, so I chain them
      // as they come
      if (!this._promises) {
        this._promises = [];        
      }
      this._promises.push(promiseWhenFinish);
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
        
        $(document.body).on("setup.row-controller.s2", _.bind(this.onSetupRow, this));
        
          this.getComponentInterface().view.on(this.robotInputComponent.events);  
          PubSub.subscribe("start_clicked.step_controller.s2", _.bind(this.onBeginProcess, this));
          $(document.body).on("endRobotProcess.s2", _.bind(function(event, data) {
            this.model.then(_.bind(function(model) {
              /*var processList = JSON.parse(model.batch.rawJson.batch.process);
              if (processList && processList.length) {
                processList = _.map(processList, function(node) { node.selected=false; return node; });
                model.batch.update({process: JSON.stringify(processList) });
              }*/
            }, this));
          }, this));
          
        /*else {
          this.robotInputComponent.setBarcode(JSON.parse(model.batch.process).robotBarcode);
          this.robotInputComponent.disable();
        }*/
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
