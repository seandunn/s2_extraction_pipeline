define([ 'config'
  , 'extraction_pipeline/workflow_engine'
  , 'mapper/s2_root'
  , 'text!scripts/pipeline_config.json'
  , 'extraction_pipeline/extra_components/busy_box'
  , 'extraction_pipeline/alerts'
], function (config, workflowEngine, S2Root, workflowConfiguration, BusyBox, alerts) {
      'use strict';

      var App = function (thePresenterFactory) {
        this.presenterFactory = thePresenterFactory;
        this.workflow = new workflowEngine(this, $.parseJSON(workflowConfiguration));
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
        this.model = $.extend(this.model, model);

        if (this.currentPagePresenter) {
          this.currentPagePresenter.release();
          delete this.currentPagePresenter;
        }

        this.workflow.askForNextPresenter(this.presenterFactory, this.model);

        return this;
      };

      App.prototype.setupNextPresenter = function (nextPresenter) {
        this.currentPagePresenter = nextPresenter;
        this.currentPagePresenter.setupPresenter(this.model, this.jquerySelection);
        delete this.model.labware;
        return this;
      };

      App.prototype.childDone = function (child, action, data) {
        console.log("A child of App (", child, ") said it has done the following action '" + action + "' with data :", data);

        var application = this;
        config.exceptionHandling(function() {
          if (action == "done") {
            $('html, body').animate({scrollTop:0}, 'slow');
            application.updateModel(data);
          } else if (action == "login") {
            application.updateModel(data);
          } else if (action == "foundNextPresenter") {
            application.setupNextPresenter(data);
          }
        });
        return application;
      };

      return App;
});
