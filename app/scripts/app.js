define(['extraction_pipeline/workflow_engine', 'extraction_pipeline/presenters/presenter_factory', 'mapper/s2_ajax'], function (workflowEngine, presenterFactory, S2Ajax) {
  var app = function () {
    this.presenterFactory = new presenterFactory();
    this.workflow = new workflowEngine(this);
    this.currentPagePresenter = undefined;
    this.model = undefined;
    return this;
  };

  /*
   *
   this.model =
   {
   userUUID : "", // current user UUID
   labwareUUID : "", // the seminal labware UUID
   batchUUID : "" // the current batch
   };

   * */
  app.prototype.setupPresenter = function (inputModel) {
    this.setupPlaceholder();
    this.setupView();
    this.renderView(); // render empty view...
    if (!inputModel) {
      inputModel = {
        userUUID:undefined,
        labwareUUID:undefined,
        batchUUID:undefined
      };
    }
    this.updateModel(inputModel);

    return this;
  };

  app.prototype.updateModel = function (input_model) {
    this.model = input_model;
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

    var inputModelForWorkflowEngine = {
      userUUID:this.model.userUUID,
      labwareUUID:this.model.labwareUUID,
      batchUUID:this.model.batchUUID
    };

    if (this.model.hasOwnProperty("HACK")) {
      inputModelForWorkflowEngine.HACK = "hack";
    }

    this.currentPagePresenter = this.workflow.getNextPresenter(this.presenterFactory, inputModelForWorkflowEngine);
//    //this.currentPagePresenter = this.workflow.get_default_presenter(this.presenterFactory);
//
//    // marshalling the data for the default presenter... here... nothing to do!
    var inputModelForPresenter = {
      userUUID:this.model.userUUID,
      labwareUUID:this.model.labwareUUID,
      batchUUID:this.model.batchUUID
    };
    if (this.model.hasOwnProperty("HACK")) {
      inputModelForPresenter.HACK = "hack";
    }

    this.currentPagePresenter.setupPresenter(inputModelForPresenter, this.jquerySelection);
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

  app.prototype.childDone = function (child, action, data) {
    // for now, when a pagePresenter has done, we just load the same old page presenter...
    console.log("A child of App (", child, ") said it has done the following action '" + action + "' with data :", data);
    var inputDataForModel;
    if (action == "done") {
      inputDataForModel = {
        userUUID:this.model.userUUID,
        labwareUUID:this.model.labwareUUID,
        batchUUID:data.batchUUID
      };

      if (data.hasOwnProperty("HACK")) {
        inputDataForModel.HACK = "hack";
      }


      this.updateModel(inputDataForModel);
    } else if (action == "login") {
      inputDataForModel = {
        userUUID:data.userUUID,
        labwareUUID:data.labwareUUID,
        batchUUID:data.batchUUID
      };

      this.updateModel(inputDataForModel);
    }

    return this;
  };

  app.prototype.HACK_add_global_tube_uuids = function (tubeUUIDs) {
    this.tubeUUIDs = tubeUUIDs;
  }


  return app;
});
