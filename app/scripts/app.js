define([ 'config'
  , 'extraction_pipeline/workflow_engine'
  , 'mapper/s2_root'
  , 'mapper/s2_ajax'
  , 'text!scripts/pipeline_config.json'
],

    function (config, workflowEngine, S2Root, S2Ajax, workflowConfiguration) {
      'use strict';

      var app = function (thePresenterFactory) {
        this.presenterFactory = thePresenterFactory;
        this.workflow = new workflowEngine(this, $.parseJSON(workflowConfiguration));
        _.templateSettings.variable = 'templateData';
        return this;
      };

      app.prototype.addEventHandlers = function(){

        $("body").on('progressEvent',progressEventHandler);

        function progressEventHandler(event, inProgress){
          if (inProgress){
            $(document.body).css( 'cursor', 'progress' );
          } else {
            $(document.body).css( 'cursor', 'default' );
          }
        }
      };

      app.prototype.resetS2Root = function () {
        delete this.s2Root;
        return this;
      };

      app.prototype.getS2Root = function () {
        var deferredS2Root = new $.Deferred();
        if (!this.s2Root) {
          var that = this;
          S2Root.load({user:"username"}).done(function (result) {
            that.s2Root = result;
            deferredS2Root.resolve(result);
          }).fail(function () {
                deferredS2Root.reject();
              });
        } else {
          deferredS2Root.resolve(this.s2Root);
        }
        return deferredS2Root.promise();
      };

      app.prototype.setupPresenter = function (inputModel) {
        this.setupPlaceholder();
        this.updateModel(inputModel || {});

        return this;
      };

      app.prototype.updateModel = function (newData) {
        this.model = $.extend(this.model, newData);
        this.updateSubPresenters();
        return this;
      };

      app.prototype.setupPlaceholder = function () {
        this.jquerySelection = function () {
          return $('#content');
        };
        return this;
      };

      app.prototype.updateSubPresenters = function () {
        if (this.currentPagePresenter) {
          this.currentPagePresenter.release();
          delete this.currentPagePresenter;
        }
        this.workflow.askForNextPresenter(this.presenterFactory, this.model);
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
      }

      return app;
    });
