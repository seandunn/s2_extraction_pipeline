define(['extraction_pipeline/default/default_presenter' ], function (defPtr, SelectionPagePresenter) {
  var workflowEngine = function (owner) {
    this.mainController = owner;
  };

  workflowEngine.prototype.getNextPresenter = function (presenterFactory, inputDataForWorkflow) {
    /**
     * data = {
     *   userUUID: "1234567890",
     *   batchUUID: "1234567890"
     * }
     */

    if (!inputDataForWorkflow.userUUID){
      return presenterFactory.createDefaultPresenter(this.mainController);
    }

    if (inputDataForWorkflow.HACK){
      return presenterFactory.createBindingCompletePage(this.mainController);

    }

    if (inputDataForWorkflow.batchUUID){
      return presenterFactory.createKitPresenter(this.mainController);
    }

    if (inputDataForWorkflow.labwareUUID) {
      // todo: according to the batch, something else should happen
      // clever things should happen here...
      return presenterFactory.createSelectionPagePresenter(this.mainController);
    }


    return presenterFactory.createDefaultPresenter(this.mainController);
  };


  return workflowEngine;
});
