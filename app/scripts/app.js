define(['workflow_engine', 'mapper/s2_ajax'], function (workflowEngine, S2Ajax) {
  var app = function () {
    this.workflow = new workflowEngine(this);
    this.currentPagePresenter = {};

    this.userBC = "";
    this.labwareBC = "";
    this.batchUUID = "";
  };

  app.prototype.init = function () {
    this.currentPagePresenter = this.workflow.get_default_presenter().init($("#content")).update();
  };

  app.prototype.childDone = function (page_presenter, action, data) {
    // for now, when a pagePresenter has done, we just load the same old page presenter...
    console.log("child done ? " + action);

    if (action == "done") {

      this.currentPagePresenter.release();
      this.currentPagePresenter = this.workflow.get_next_presenter().init($('#content')).update();
    } else if (action == "login") {
      console.log(data);
      this.userBC = data.userBC;
      this.labwareBC = data.labwareBC;
      this.batchUUID = data.batchUUID;

      this.currentPagePresenter.release();
      this.currentPagePresenter = this.workflow.get_next_presenter().init($('#content')).update();
    }
    return this.appModel;
  };

  return app;
});