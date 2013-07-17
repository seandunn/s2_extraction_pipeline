define([ 'config'
  , 'extraction_pipeline/workflow_engine'
  , 'mapper/s2_root'
  , 'extraction_pipeline/extra_components/busy_box'
  , 'extraction_pipeline/alerts'
], function (config, nextWorkflow, S2Root, BusyBox, alerts) {
  'use strict';

  var App = function (thePresenterFactory) {
    var app = this;
    app.presenterFactory = thePresenterFactory;
    _.templateSettings.variable = 'templateData';

    $('#server-url').text(config.apiUrl);
    $('#release').text(config.release);

    if ($('#content.sample-extraction').length > 0) {
      // ToDo #content exists at this point we should pass it directly not a function
      app.jquerySelection = function () { return $('#content'); };
      app.addEventHandlers();
      app.setupPresenter();
    } else if ($('#content.sample-reception').length > 0) {
      var configuration = { printerList: config.printers };
      var receptionPresenter = app.presenterFactory.create('reception_presenter', app, configuration);
      $("#content").append(receptionPresenter.view);
      alerts.setupPlaceholder(function () {
        return $('#alertContainer');
      });
      app.addEventHandlers();
    } else if ($('#content.extraction-reracking').length > 0) {
      var configuration = { printerList: config.printers };
      var extractionPresenter = app.presenterFactory.create('lab_activities_presenter', app, configuration);
      $("#content").append(extractionPresenter.view);
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
  };

  App.prototype.getS2Root = function(user) {
    if ( user || (this.rootPromise === undefined) ) {
      // User should be passed in here not hard-coded
      this.rootPromise = S2Root.load({user:user});
    }
    return this.rootPromise;
  };

  App.prototype.resetS2Root = function() {
    delete this.rootPromise;
  };

  App.prototype.setupPresenter = function (inputModel) {
    alerts.setupPlaceholder(function () {
      return $('#alertContainer');
    });
    this.updateModel(inputModel || {});

    return this;
  };

  App.prototype.updateModel = function (model) {
    var application = this;
    this.model = $.extend(this.model, model);

    if (this.currentPagePresenter) {
      this.currentPagePresenter.release();
      delete this.currentPagePresenter;
    }

    nextWorkflow(this.model).
      then(function(workflowConfig){
      return application.presenterFactory.create(workflowConfig && workflowConfig.presenterName, application, workflowConfig);
    }).then(function(nextPresenter){
      application.currentPagePresenter = nextPresenter;
      application.currentPagePresenter.setupPresenter(application.model, application.jquerySelection);
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
