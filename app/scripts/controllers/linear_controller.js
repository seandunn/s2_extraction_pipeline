define([ "config", 
         "event_emitter", 
         "controllers/base_controller", 
         "app-components/controllers/print",
         "app-components/controllers/process",
         "app-components/scanning/bed-verification"], 
         function(config, EventEmitter, Base, PrintController, ProcessController, BedVerification) {
  /* Model */
  
  function Inputs() {
    $.extend(this, new EventEmitter());    
    this._events = ["inputLoaded", "inputsCompleted"];
    this._inputs = [];
  }
    
  Inputs.prototype.loadInputs = function(items) {
    _.each(items, _.bind(function(item) {
      if (!_.find(this._inputs, function(input) {
        return (item.uuid===input.uuid);
      })) {
        this._inputs.push(item);
      }
    }, this));
    this.emit("inputsLoaded");    
    return this._inputs;
  };
  
  Inputs.prototype.getBedVerificationModel = function() {
    return config.rootPromise.then(_.bind(function(root) {
      return $.when.apply(this, _.map(this._inputs, function(input) {
        return root.find(input.uuid);
      })).then(function() {
        var allInputs = arguments;
        return _.object(_.map(allInputs, function(input, pos) {
          if (!input.expected_type) {
            input.expected_type=input.resourceType;
          }
          input.allInputs=allInputs;
          return ["labware" + (pos + 1), input];
        }));
      });
    }, this));
  };
  
  Inputs.prototype.loadBatch = function(batch) {
    return batch.items.then(_.bind(function(items) {
      this.loadInputs(_.filter(items, function(item) {
        return item.status==="done";
      }));
    }, this));
  };
  
  function Outputs() {
    $.extend(this, new EventEmitter());    
  }
  
  function View() {
    $.extend(this, new EventEmitter());    
  }
  
  var allRacksFullExceptTheLast = {
    checkMethod: function(labwareInputModel, position, labware) {
      var numRacks = _.keys(labwareInputModel).length;
      return ((position===(numRacks-1)) || (labware.tubes.length===(labware.number_of_rows*labware.number_of_columns)));
    },
    errorMessage: function(labwareInputModel, position, labware) {
      return ["The rack in position ", (position+1), " must be totally full"].join('');
    }
  };
  
  View.prototype.renderInputs = function(inputs) {
    inputs.getBedVerificationModel().then(_.bind(function(bedVerificationModel) {
      this._bedVerification = new BedVerification({
        model: bedVerificationModel,
        labwareValidations: [allRacksFullExceptTheLast]
      });
      $("#step2").append(this._bedVerification.view).on(this._bedVerification.events).on("scanned.bed-verification.s2", _.bind(function() {
        this.emit("bedVerificationValidated", arguments);
      }, this));
    }, this));
  };
  
  View.prototype.setSelector = function(selector) {
    this._selector = selector;
  };
  
  View.prototype.setPlateInputValidations = function(validations) {
    this._validations = validations;
  };
  
  View.prototype.startScanning = function() {
    this._bedVerification.view.trigger("activate");
  };
  
  function compose(obj1, obj2) {
    var obj3 = {};
    for (var key in obj2) {
      if (((typeof obj1[key]==="function") && 
      (typeof obj2[key]==="function")) && 
      (obj1[key]!==obj2[key])) {
        // Creates a composed function from obj1
        // and obj2
        obj3[key]=_.partial(function(m1, m2) {
          var args = _.drop(arguments, 2);
          var value = m1.apply(this, args);
          m2.apply(this, args);
          return value;
        }, obj1[key], obj2[key]);
      }
    }
    // Copies everything from obj2
    $.extend(obj1, obj2);
    // Overwrites with the composed functions when
    // obj1 and obj2 share same name of function
    $.extend(obj1, obj3);
    return obj1;
  }
  
  var Controller = Object.create(Base);
  return $.extend(Controller, {
    register : function(callback) {
      console.log("register call");
      console.dir(arguments);
      callback("linear_controller", function() {
        console.log("callback");
        console.dir(arguments);
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },
    initialController: function() {
      // on first focus
    },
    attachHandlers: function() {
      this._inputsModel.on("inputsLoaded", _.bind(this.onInputsLoaded, this));
      this._inputsModel.on("inputScanned", _.bind(this.onInputScanned, this));
      this._inputsModel.on("inputsCompleted", _.bind(this.emit, this, "completedRow"));
      
      this._view.on("bedVerificationValidated", _.bind(this.onBedVerification, this));
      
      $(document.body).on("scanned.robot.s2", _.bind(this.onScannedRobot, this));      
    },
    onBedVerification: function(args) {
      //this.emit("controllerDone", this);
      var bedVerification = args[1];
      this._plates = _.pluck(bedVerification.verified, "plate");
      this.emit("printReady");
    },
    onScannedRobot: function(robot) {
      this._view.startScanning();
    },
    
    onInputsLoaded: function() {
      this._view.renderInputs(this._inputsModel);
    },
    onInputScanned: function() {
      
    },
    
    
    init: function(owner, factory, config) {
      PrintController.init.call(this, owner, factory, config);
      compose(this, PrintController);
      compose(this, ProcessController);
        
      console.log("init");
      console.dir(arguments);
      
      this._inputsModel = new Inputs();
      this._view = new View(config);
      
      this.attachHandlers();
    },
    setupController: function(setupData, selector) {
      this._view.setSelector(selector);
      
      this.model.setBatch(setupData.batch);
      
      this._inputsModel.loadBatch(setupData.batch, setupData.initialLabware);
    }
  });
});