define([ 'config'
  , 'extraction_pipeline/workflow_engine'
  , 'mapper/s2_root'
  , 'mapper/s2_ajax'
  , 'text!scripts/pipeline_config.json'
//  , 'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction/1.json'
],
    function (config, workflowEngine, S2Root, S2Ajax, workflowConfiguration) {
      var app = function (thePresenterFactory) {
        this.presenterFactory = thePresenterFactory;
        this.workflow = new workflowEngine(this, $.parseJSON(workflowConfiguration));

        this.currentPagePresenter = undefined;
        this.model = undefined;

        return this;
      };

      app.prototype.resetS2Root = function () {
        this.s2Root = undefined;
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
        this.setupView();
        this.renderView(); // render empty view...
        if (!inputModel) {
          inputModel = {
            userUUID:undefined,
            labware:undefined,
            batch:undefined
          };
        }
        this.updateModel(inputModel);

        return this;
      };

      app.prototype.updateModel = function (newData) {
        /*
         inputModel =
         {
         userUUID    : "", // current user UUID
         labwareUUID : "", // the seminal labware UUID
         batchUUID   : "" // the current batch
         };
         */
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
          this.currentPagePresenter = undefined;
        }

        this.currentPagePresenter = this.workflow.getNextPresenter(this.presenterFactory, this.model);

        this.currentPagePresenter.setupPresenter(this.model, this.jquerySelection);
        this.model.labware = undefined;
        return this;
      };

      app.prototype.setupView = function () {
        // no view for this presenter...
        return this;
      };

      app.prototype.renderView = function () {
        // nothing to render
        return this;
      };

      app.prototype.release = function () {
        return this;
      };

      app.prototype.displayError = function(message) {
        bootbox.alert(message);
        return this;
      };

      app.prototype.childDone = function (child, action, data) {
        console.log("A child of App (", child, ") said it has done the following action '" + action + "' with data :", data);
        try {
          if (action == "done") {

            $('html, body').animate({scrollTop:0}, 'slow');
//            $('#content').toggle('slow');
//            $('#content').toggle('slow');

            this.updateModel(data);
          } else if (action == "error") {
            this.displayError(data.message);

          } else if (action == "login") {
            this.updateModel(data);
          }

          return this;
        } catch (err) {
          if (err.message == "DataSchemaError") {
            // do something ?
            throw {
              type:"DataSchemaError",
              message:"DataSchemaError"
            }
          } else {
            throw err;
          }
        }

      };

      return app;
    });
