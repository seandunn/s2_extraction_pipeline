define([ 'config'
  , 'extraction_pipeline/workflow_engine'
  , 'mapper/s2_root'
  , 'extraction_pipeline/extra_components/busy_box'
  , 'extraction_pipeline/alerts'
  , 'extraction_pipeline/lib/logger'
], function (config, nextWorkflow, S2Root, BusyBox, alerts, Logger) {
  'use strict';

  var App = function (theControllerFactory) {
    var app = this;
    app.controllerFactory = theControllerFactory;
    _.templateSettings.variable = 'templateData';

    $('#server-url').text(config.apiUrl);
    $('#release').text(config.release);

    if ($('#content.sample-extraction').length > 0) {
      // ToDo #content exists at this point we should pass it directly not a function
      app.jquerySelection = function () { return $('#content'); };
      app.addEventHandlers();
      app.setupController();
    } else if ($('#content.sample-reception').length > 0) {
      var configuration = { printerList: config.printers };
      var receptionController = app.controllerFactory.create('reception_controller', app, configuration);
      $("#content").append(receptionController.view);
      alerts.setupPlaceholder(function () {
        return $('#alertContainer');
      });
      app.addEventHandlers();
    } else if ($('#content.extraction-reracking').length > 0) {
      var configuration = { printerList: config.printers };
      var extractionController = app.controllerFactory.create('lab_activities_controller', app, configuration);
      $("#content").append(extractionController.view);
      alerts.setupPlaceholder(function () {
        return $('#alertContainer');
      });
      app.addEventHandlers();
    } else {
      console.log('#content control class missing from web page.')
    }
  };

  App.prototype.addEventHandlers = function(){
    BusyBox.init();
    Logger.init();
  };

  App.prototype.getS2Root = function(user) {
    if ( user || (this.rootPromise === undefined) ) {
      // User should be passed in here not hard-coded
      Logger.user = user;
      this.rootPromise = S2Root.load({user:user});
    }
    return this.rootPromise;
  };

  App.prototype.resetS2Root = function() {
    delete this.rootPromise;
  };

  App.prototype.setupController = function (inputModel) {
    alerts.setupPlaceholder(function () {
      return $('#alertContainer');
    });
    this.updateModel(inputModel || {});

    return this;
  };

  App.prototype.updateModel = function (model) {
    var application = this;
    this.model = $.extend(this.model, model);

    if (this.currentPageController) {
      this.currentPageController.release();
      delete this.currentPageController;
    }

    nextWorkflow(this.model).
      then(function(workflowConfig){
      return application.controllerFactory.create(workflowConfig && workflowConfig.controllerName, application, workflowConfig);
    }).then(function(nextController){
      application.currentPageController = nextController;
      application.currentPageController.setupController(application.model, application.jquerySelection);
      delete application.model.labware;
    });

    return this;
  };

  App.prototype.childDone = function (child, action, data) {
    console.log("A child of App (", child, ") said it has done the following action '" + action + "' with data :", data);

    var application = this;
    config.exceptionHandling(function() {
      if (action == "done") {
        application.updateModel(data);
      } else if (action == "login") {
        application.updateModel(data);
      }
    });
    return application;
  };

  return App;
});
