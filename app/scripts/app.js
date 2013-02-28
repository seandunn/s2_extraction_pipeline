define(['extraction_pipeline/workflow_engine', 'extraction_pipeline/presenters/presenter_factory', 'mapper/s2_ajax'], function (workflowEngine, presenterFactory, S2Ajax) {
  var app = function () {
    this.presenterFactory = new presenterFactory();
    this.workflow = new workflowEngine(this);
    this.currentPagePresenter = {};

    this.userBC = "";
    this.labwareBC = "";
    this.batchUUID = "";
    return this;
  };

  app.prototype.setupPresenter = function () {
    console.log("App : setupPresenter");

    this.setupPlaceholder();
    this.setupView();
    this.renderView(); // render empty view...
    var input_model = {};
    this.updateModel(input_model);

    return this;
  };

  app.prototype.updateModel = function (input_model) {
    console.log("App : updateModel");
    this.model = input_model;
    this.updateSubPresenters();
    return this;
  };

  app.prototype.setupPlaceholder = function () {
    console.log("App : setupPlaceholder");
    this.jquerySelection = function () {
      return $('#content');
    };
    return this;
  };

  app.prototype.updateSubPresenters = function () {
    console.log("App : updateSubPresenters");
//    this.currentPagePresenter = this.workflow.get_default_presenter(this.presenterFactory);
//    this.currentPagePresenter.setupPresenter(this.model, this.jquerySelection);
    var data = {userBC:"1234567890", labwareBC:"1234567890", batch:undefined};
    this.userBC = data.userBC;
    this.labwareBC = data.labwareBC;
    this.batchUUID = data.batchUUID;

    this.currentPagePresenter = this.workflow.get_next_presenter(this.presenterFactory);
    this.currentPagePresenter.setupPresenter(this.userBC, this.jquerySelection);


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

  app.prototype.childDone = function (page_presenter, action, data) {
    // for now, when a pagePresenter has done, we just load the same old page presenter...
    console.log("child done ? " + action);

    if (action == "done") {

//      this.currentPagePresenter.release();
//      this.currentPagePresenter = this.workflow.get_next_presenter(this.presenterFactory).init($('#content')).update();
    } else if (action == "login") {
      console.log(data);
      this.userBC = data.userBC;
      this.labwareBC = data.labwareBC;
      this.batchUUID = data.batchUUID;

      this.currentPagePresenter.release();
      this.currentPagePresenter = this.workflow.get_next_presenter(this.presenterFactory);
      this.currentPagePresenter.setupPresenter(this.userBC, this.jquerySelection);
    }

    return this.appModel;
  };

  return app;
});
