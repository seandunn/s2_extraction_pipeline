define([ 'config'
  , 'extraction_pipeline/workflow_engine'
  , 'mapper/s2_root'
  , 'mapper/s2_ajax'
  , 'text!scripts/pipeline_config.json'
  , 'extraction_pipeline/extra_components/busy_box'
  , 'extraction_pipeline/alerts'
], function (config, workflowEngine, S2Root, S2Ajax, workflowConfiguration, BusyBox, alerts) {
      'use strict';

      var app = function (thePresenterFactory) {
        this.presenterFactory = thePresenterFactory;
        this.workflow = new workflowEngine(this, $.parseJSON(workflowConfiguration));
        _.templateSettings.variable = 'templateData';
        this.addEventHandlers();
        return this;
      };

      app.prototype.addEventHandlers = function(){
        BusyBox.init();
      };

      app.prototype.getS2Root = function() {
        if (this.rootPromise === undefined) {
          // User should be passed in here not hard-coded
          this.rootPromise = S2Root.load({user:"username"});
        }

        return this.rootPromise;
      };

      app.prototype.setupPresenter = function (inputModel) {
        this.setupPlaceholder();
        alerts.setupPlaceholder(function () {
          return $('#alertContainer');
        });
        this.updateModel(inputModel || {});

        return this;
      };

      app.prototype.updateModel = function (model) {
        this.model = $.extend(this.model, model);

        if (this.currentPagePresenter) {
          this.currentPagePresenter.release();
          delete this.currentPagePresenter;
        }

        this.workflow.askForNextPresenter(this.presenterFactory, this.model);

        return this;
      };

      app.prototype.setupPlaceholder = function () {
        this.jquerySelection = function () {
          return $('#content');
        };
        return this;
      };

      app.prototype.updateSubPresenters = function () {
      };

      app.prototype.setupNextPresenter = function (nextPresenter) {
        this.currentPagePresenter = nextPresenter;
        this.currentPagePresenter.setupPresenter(this.model, this.jquerySelection);
        delete this.model.labware;
        return this;
      };

      app.prototype.release = function () {
        this.jquerySelection().empty();
        return this;
      };

      app.prototype.displayError = function (message) {
        bootbox.alert(message);
        return this;
      };

      app.prototype.childDone = function (child, action, data) {
        console.log("A child of App (", child, ") said it has done the following action '" + action + "' with data :", data);

        var application = this;
        config.exceptionHandling(function() {
          if (action == "done") {
            $('html, body').animate({scrollTop:0}, 'slow');
            application.updateModel(data);
          } else if (action == "error") {
            application.displayError(data.message);
          } else if (action == "login") {
            application.updateModel(data);
          } else if (action == "foundNextPresenter") {
            application.setupNextPresenter(data);
          }
        });
        return application;
      };

      return app;
});
