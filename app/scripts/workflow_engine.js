define(['default/default_presenter',
  'presenters/selection_page_presenter',
  'labware/scripts/presenters/tube_presenter'], function (defPtr, SelectionPagePresenter, tubePtr) {
  var workflowEngine = function (owner) {
    this.mainController = owner;
  };

  workflowEngine.prototype.get_next_presenter = function (presenterFactory) {
    // use the this.mainController.appModel to decide what to do next

    if (!this.mainController.batchUUID) {
      //var batch = new rsc('/1234567890/batch/or/whatever/is/suitable/to/find/a/batch','read');
      this.mainController.batchUUID = ''; // TODO: something better than empty...
    }
    // todo: according to the batch, something else should happen
    if (!this.mainController.batchUUID) {
      return new SelectionPagePresenter(this.mainController, presenterFactory);
    }
  };

  workflowEngine.prototype.get_default_presenter = function (presenterFactory) {
    return new defPtr(this.mainController, presenterFactory);
  };

  return workflowEngine;
});
