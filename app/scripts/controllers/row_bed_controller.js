 define(["lib/pubsub", 
  "views/row_view", 
  "app-components/linear-process/linear-process",
  "app-components/labware/display_controller_wrapper",
  "app-components/scanning/bed-verification" , "app-components/scanning/bed-recording", "controllers/base_controller"
], function (PubSub, View, linearProcess, labwareControllerWrapper, bedVerification, bedRecording, BaseController) {
  "use strict";

  /* Sample model input:
   *
   *{
   * "rowNum" : i,
   * "labware1" : {
   *   "uuid" : this.model[i],
   *   "expected_type" : "tube",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * },
   * "labware2" : {
   *   "expected_type" : "spin_column",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * },
   * "labware3" : {
   *   "expected_type" : "waste_tube",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * }
   *};
   */
  var robotsConfig = [];
  
  
  function findRootPromise(controller) {
    var iterations = 0;
    while (iterations <20) {
      if (controller.rootPromise) {
        return controller.rootPromise;
      }
      controller = controller.owner;
      iterations++;
    }
    throw new Error("Infinite loop while finding root promise");
  }

  function startMyRow(controller) {
    if (controller.jquerySelection().hasClass("row0"))
      {
        $(controller.jquerySelection()[0]).trigger("activate");
      }
  }
  
  function reloadToIndex() {
    var ref = window.location.href;
    ref = ref.replace(/#.*/, "");
    window.location.href = ref;
  }
  
  function markAsCompletedRow(controller, data, verification) {
    controller.editableControllers = _.partial(function(verification) {
      return _.chain(verification.verified).map(function(record) { return {
        isComplete: _.partial(_.identity, true),
        labwareModel: { resource: record.plate}};
        });
    }, verification);
    controller.owner.childDone(controller, "completed", data);
  } 
  
  function markAsCompletedRowBR(controller, data, verification) {
    controller.editableControllers = _.partial(function(verification) {
      // in bedRecording connected we need to have at least one input and one output per each row
      return _.chain(verification.verified).map(function(record) { 
        return {
          isComplete: _.partial(_.identity, true),
          labwareModel: { resource: record.plate}};}).reduce(function(memo, node) {
          return memo.concat([node, _.clone(node)]);
        }, []);
    }, verification);
  } 

  //TODO: check this declaration is ok
  var RowModel = Object.create(Object.prototype);

  $.extend(RowModel, {
    init:function (owner) {
      this.owner        = owner;
      this.labwares     = {};
      this.enabled      = true;
      return this;
    },
    setupModel:function (inputModel) {
      this.rowNum       = inputModel.rowNum;
      this.enabled      = inputModel.enabled;
      this.labwares     = inputModel;
      delete this.labwares.rowNum;
      delete this.labwares.enabled;
      delete this.labwares.process;
    },
    setResource:function (value) {
      this.resource = value;
    }
  });

  var RowController = Object.create(BaseController);

  $.extend(RowController, {
    register: function(callback) {
      callback('row_bed_controller', function(owner, factory) {
        return Object.create(RowController).init(owner, factory);
      });
    },

    init:function (owner, controllerFactory) {
      this.controllerFactory = controllerFactory;
      this.owner = owner;
      if (robotsConfig.length===0) {
        robotsConfig = robotsConfig.concat(this.getAppConfig().Robots);        
      }
      return this;
    },
    hideEditable: function() {
      
    },
    loadFromInputs: function(process, inputModel, component, typeLoadBedVerification) {
      if (!process) {
        return false;
      }
      var plate1 = inputModel.labware1.resource;
      if (!plate1) { return false; }
      var plate2 = inputModel.labware2.resource;
      var barcode1 = plate1.rawJson[inputModel.labware1.expected_type].labels.barcode.value;
      var barcode2;
      if (typeLoadBedVerification) {
        if (plate2) {
          barcode2 = plate2.rawJson[inputModel.labware2.expected_type].labels.barcode.value;
        } else {
          return false;
        }        
        component.fromObj([[barcode1, null], [barcode2, null]]);
        markAsCompletedRow(this, {buttons: [{action: "start"}]}, {verified: [{
          robot: process,
            bed: null,
              plate: plate1
        }, {
          robot: process,
          bed: null,
            plate: plate2
        }]});
        $(".robot input").prop("value", process);
      } else {
        markAsCompletedRowBR(this, {buttons: [{action: "start"}]}, {verified: [{
          robot: process,
            bed: null,
              plate: plate1
        }]});
        $(".robot input").prop("value", process);
        $(".robot input").prop("disabled", true);
        component.fromObj([barcode1, null]);
      }
      PubSub.publish("disable_buttons.step_controller.s2", this.owner, {buttons: [{action: "start"}]});
      PubSub.publish("enable_buttons.step_controller.s2", this.owner, {buttons: [{action: "end"}]});      
      return true;
    },
    getBedVerificationInfo: function(inputModel) {
      return this.controllers.map(function(value, pos, list) {
        if ((pos % 2)===0) 
          return [value, list[pos+1]];
    }).compact().reduce(_.bind(function(memo, p) {
      
      function plateLabwareValidation(labwareInputModel, labware) {
        var defer = $.Deferred();
        if (labware.resourceType === labwareInputModel.expected_type) {
          defer.resolve(labware);
        } else {
          defer.reject();
          PubSub.publish("error.status.s2", undefined, 
            {message: ["Expected a '", 
                       labwareInputModel.expected_type, 
                       "' barcode but scanned a '",
                       labware.resourceType,
            "'"].join('')});
        }
        return defer;
      }
      
      var component = bedVerification({
        bedsConfig: robotsConfig,
        plateValidations: [_.partial(plateLabwareValidation, inputModel.labware1),
                           _.partial(plateLabwareValidation, inputModel.labware2)],
        fetch: _.partial(function(rootPromise, barcode) {
          return rootPromise.then(function(root) {
            return root.findByLabEan13(barcode);
          });
        }, findRootPromise(this))
      });
      
      var promise = $.Deferred();
      component.view.on("scanned.bed-recording.s2", _.bind(promise.resolve, promise));
      
      memo.promises.push(promise);
      memo.components.push(component);
      return memo;
    }, this), {promises: [], components: []}).value();
    },
    renderBedVerification: function() {
      this.jquerySelection().html("");
      this.jquerySelection().append(this.linearProcessLabwares.view);
      var arrow = "<div class='transferArrow span1 offset1'><span >&rarr;</span></div>";
      $(arrow).insertAfter($(".left", this.jquerySelection())[0]);
      
    },
    onErrorBedVerification: function(inputModel) {
      $("input,button").attr("disabled", true);
      $("input").val("");
      this.jquerySelection().html("");
      this.setupControllerWithBedVerification(inputModel);
      $(".robot input").prop("disabled", false).focus();
      $("button.nextButton").on("click", function(e) {
        e.preventDefault();
        reloadToIndex();
        return false;
      });
    },
    setupControllerWithBedVerification: function(inputModel) {
      var controller = this;
      $(".robot input").prop("value", "");
      var bedRecordingInfo = this.getBedVerificationInfo(inputModel);
      this.linearProcessLabwares = bedRecordingInfo.components[0];
      var loadedProcess = this.loadFromInputs(inputModel.labware1.process, inputModel, this.linearProcessLabwares, true);
      if (!loadedProcess) {
        this.editableControllers = _.partial(_.identity, 
          _.chain(bedRecordingInfo.components).map(function(p) { 
            return _.extend(p, {isComplete: _.partial(_.identity, true)});
          }));
      }

      // Config view
      this.renderBedVerification();

      $(document.body).on("error.bed-verification.s2", _.bind(_.partial(this.onErrorBedVerification, inputModel), this));
      
      // Enable linear process if robot scanned
      controller.owner.owner.activeController = this.owner;
      controller.jquerySelection().on(_.omit(this.linearProcessLabwares.events, "scanned.robot.s2"));
      $(document.body).on(_.pick(this.linearProcessLabwares.events, "scanned.robot.s2"));

      $(document.body).on("scanned.robot.s2", _.partial(startMyRow, controller));
      
      // When bed verification checked for the linear process
      controller.jquerySelection().on("scanned.bed-verification.s2", $.ignoresEvent(_.bind(_.partial(function(controller, data, verification) {
        if ($.contains(document, controller.linearProcessLabwares.view[0])) {
          markAsCompletedRow(controller, data, verification);
          if (this.rowModel.rowNum === (this.owner.rowControllers.length-1)) {
            PubSub.publish("enable_buttons.step_controller.s2", this.owner, {buttons: [{action: "start"}]});      
          } else {
            PubSub.publish("disable_buttons.step_controller.s2", this.owner, {buttons: [{action: "start"}]});            
          }
        }
      }, controller, {buttons: [{action: "start"}]}), this)));
      PubSub.publish("disable_buttons.step_controller.s2", this.owner, {buttons: [{action: "start"}]});
    },
    
    getBedRecordingInfo: function() {
      return this.controllers.reduce(_.bind(function(memo, p) { 
        var component;
        p.renderView();        
        if (_.has(p, "bedController"))
          {
            component = p.bedController.component;
          }
        else {
          component = bedRecording({
            bedsConfig: robotsConfig,
            fetch: _.partial(function(rootPromise, barcode) {
              return rootPromise.then(function(root) {
                return root.findByLabEan13(barcode);
              });
            }, findRootPromise(this))
          });
        }
        var promise = $.Deferred();
        component.view.on("scanned.bed-recording.s2", _.bind(promise.resolve, promise));
        
        $(".transferArrow").hide();
        
        memo.promises.push(promise);
        memo.components.push(component);
        return memo;
      }, this), {promises: [], components: []}).value();      
    },
    onErrorBedRecording: function(inputModel) {
      $("input,button").attr("disabled", true);
      $("input").val("");
      this.jquerySelection().html("");
      this.setupControllerWithBedRecording(inputModel);
      $(".robot input").prop("disabled", false).focus();
      $("button.nextButton").on("click", function(e) {
        e.preventDefault();
        reloadToIndex();
        return false;
      });
      },
    renderBedRecording: function() {
      this.jquerySelection().append(this.linear.view);
      this.jquerySelection().on(_.omit(this.linear.events, "scanned.robot.s2"));
      $(document.body).on(_.pick(this.linear.events, "scanned.robot.s2"));      
    },
    setupControllerWithBedRecording: function(inputModel) {
      $(".robot input").prop("disabled", false);
      var controller = this;
      var bedRecordingInfo = this.getBedRecordingInfo();
      var linear = this.linearProcessLabwares = this.linear = bedRecordingInfo.components[0]; 
      
      var loadedProcess = this.loadFromInputs(inputModel.labware1.process, inputModel, this.linearProcessLabwares, false);
      // Configs view
      this.renderBedRecording();
      
      $(document.body).addClass("bed-recording");
      
      $(document.body).on("error.bed-recording.s2", _.bind(_.partial(this.onErrorBedRecording, inputModel), this));
      controller.owner.owner.activeController = this.owner;
      // When robot scanned, enable linear process
      $(document.body).on("scanned.robot.s2", _.partial(startMyRow, controller));
      
      $.when.call(this, bedRecordingInfo.promises[0]).then(_.bind(_.partial(function(controller, data, event, verification) {
        markAsCompletedRowBR(controller, data, verification);
        controller.owner.childDone(controller, "completed", data);
        if (this.rowModel.rowNum === (this.owner.rowControllers.length-1)) {
          PubSub.publish("enable_buttons.step_controller.s2", this.owner, {buttons: [{action: "start"}]});      
        } else {
          PubSub.publish("disable_buttons.step_controller.s2", this.owner, {buttons: [{action: "start"}]});            
        }        
      }, controller, {buttons: [{action: "start"}]}), this));
      
      this.linearProcessLabwares = linear;
    },
    
    setupController:function (input_model, jquerySelection) {
      var controller = this;
      this.jquerySelection = jquerySelection;

      this.rowModel = Object.create(RowModel).init(this);
      this.rowModel.setupModel(input_model);

      this.currentView = new View(this, this.jquerySelection());

      // NOTE: sort() call is needed here to ensure labware1,labware2,labware3... ordering
      
      this.controllers = _.chain(this.rowModel.labwares).pairs().sort().map(function(nameToDetails) {
        var name = nameToDetails[0], details = nameToDetails[1];
        var subController = controller.controllerFactory.create('labware', controller);
        subController.setupController(details.resource, function() { return controller.jquerySelection().find('.' + name); });
        return subController;
      });

      this.currentView.renderView();
      $(document.body).addClass("gel");
      if (this.owner.config.rowBehaviour==="bedRecording") {
        this.setupControllerWithBedRecording(input_model);
      } else {
        // onBarcodePrintSuccess
        PubSub.subscribe("printing_finished.barcodePrintSuccess", _.bind(function() {
          // Enable the robot
          $(".robot input").prop("disabled", false).focus();
        }, this));
        PubSub.publish("enable_buttons.step_controller.s2", this.owner, {buttons: [{action: "print"}]});        
        this.setupControllerWithBedVerification(input_model);
      }
      $("button.nextButton").on("click", function(e) {
        e.preventDefault();
        reloadToIndex();
        return false;
      });      
   },

    release:function () {
      this.jquerySelection().release();
      return this;
    },

    setLabwareVisibility:function () {
      // Each labware controller is only enabled if it's previous is complete and it is not complete
      this.controllers.reduce(function(memo, controller) {
        if (!memo) {
          controller.labwareEnabled(false);
          return false;
        }

        if (controller.isSpecial()) {
          controller.labwareEnabled(false);
          return true;
        } else if (controller.isComplete()) {
          controller.labwareEnabled(false);
          return true;
        } else {
          controller.labwareEnabled(true);
          return false;
        }
      }, this.rowModel.enabled).value();
    },
    focus: function() {
      var nextInput = this.editableControllers()
        .find(function(p) { return !p.isComplete(); })
        .value();
      if (nextInput && nextInput.barcodeFocus) {
        nextInput.barcodeFocus();
      }      
    },

    childDone:function (child, action, data) {
      var eventPrefix;
      
      data = $.extend(data, { origin: child });
      
      if (action == "tube rendered") {
        this.owner.childDone(this, "tubeFinished", data);
      } else if (action === 'resourceUpdated') {
        if (this.isRowComplete() && (child === this.editableControllers().last().value())) {
          this.owner.childDone(this, "completed", data);
        }
      } else if (action == "labwareRendered") {
        this.setLabwareVisibility();
      } else if (action === 'removeLabware') {
        eventPrefix = child.labwareModel.input ? 'input' : 'output';
        child.release();
        delete child.resource;
        delete child.resourceController;
        delete child.barcodeInputController;
        child.setupController(this.rowModel.labwares['labware' + (this.controllers.value().indexOf(child) + 1)], child.jquerySelection);
        child.renderView();
        this.owner.childDone(this, eventPrefix+'Removed', data);
      } else if (action === "barcodeScanned") {
        eventPrefix = child.labwareModel.input ? 'input' : 'output';
        this.owner.childDone(this, eventPrefix+'BarcodeScanned', data);
        this.focus();
      }
    },

    editableControllers: function() {
      return this.controllers.compact().filter(function(controller) { 
        return !controller.isSpecial()  && !((!_.isUndefined(controller.labwareModel.resource)) && (controller.labwareModel.resource.tracked === false));
      });
    },

    isRowComplete: function() {
      return this.editableControllers().all(function(p) { return p.isComplete(); }).value();
    },

    lockRow: function() {
      $("input", this.jquerySelection()).prop("disabled", true);
    },

    unlockRow: function(){
      if (!this.jquerySelection().hasClass("row0"))
        {
          $($(".linear-process", this.jquerySelection())[0]).trigger("activate");
        }
      this.focus();
    },

    handleResources: function(callback) {
      callback.apply(null, this.editableControllers().map(function(p) { return p.labwareModel.resource; }).value());
    }
  });

  return RowController;
});
