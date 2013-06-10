define([ 'config'
  , 'extraction_pipeline/workflow_engine'
  , 'mapper/s2_root'
  , 'extraction_pipeline/extra_components/busy_box'
  , 'extraction_pipeline/alerts'
], function (config, nextWorkflow, S2Root, BusyBox, alerts) {
  'use strict';

  var App = function (thePresenterFactory) {
    this.presenterFactory = thePresenterFactory;
    _.templateSettings.variable = 'templateData';

    $('#server-url').text(config.apiUrl);
    $('#release').text(config.release);
    // ToDo #content exists at this point we should pass it directly not a function
    this.jquerySelection = function () { return $('#content'); };
    this.addEventHandlers();
    return this;
  };

  App.prototype.addEventHandlers = function(){
    BusyBox.init();
  };

  App.prototype.getS2Root = function() {
    if (this.rootPromise === undefined) {
      // User should be passed in here not hard-coded
      this.rootPromise = S2Root.load({user:"username"});
    }

    return this.rootPromise;
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
