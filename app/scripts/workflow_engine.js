define(['config'
  , 'mapper/s2_root'
], function (config, S2Root) {

  var workflowEngine = function (owner, config) {

    this.mainController = owner;
    this.default = config["default"];
    this.rules = config["rules"];
  };

  // Returns a function that finds the first "ready" item in the batch that matches the given rule.
  function itemMatcherForBatch(batch) {
    return function(rule) {
      return _.chain(batch.items)
              .filter(function(item) { return item.status === 'ready'; })
              .filter(function(item) { return item.role === rule[0]; })
              .first()
              .value();
    };
  }

  workflowEngine.prototype.getNextPresenterName = function (inputDataForWorkflow) {
    /**
     * inputDataForWorkflow is a batch
     */
    console.log(inputDataForWorkflow);
    var presenterRule = _.chain(this.rules).find(itemMatcherForBatch(inputDataForWorkflow)).value();
    return presenterRule ? presenterRule[1] : this.default;
  };

  workflowEngine.prototype.getNextPresenterFromName = function (presenterFactory, presenterName) {
    switch (presenterName) {
      case "binding_complete_page":
        return presenterFactory.createBindingCompletePage(this.mainController);
      case "kit_presenter_page":
        return presenterFactory.createKitPresenter(this.mainController);
      case "selection_page_presenter":
        return presenterFactory.createSelectionPagePresenter(this.mainController);
      case "binding_finished_page_presenter":
        return presenterFactory.createBindingFinishedPage(this.mainController);
      case "elution_loading_page_presenter":
        return presenterFactory.createElutionLoadingPage(this.mainController);
      case "elution_wash_page_presenter":
        return presenterFactory.createElutionWashPage(this.mainController);
      default:
        return presenterFactory.createDefaultPresenter(this.mainController);
    }
  };


  workflowEngine.prototype.getNextPresenter = function (presenterFactory, inputDataForWorkflow) {
    var presenterName = undefined;
    if (!inputDataForWorkflow.userUUID) {
      console.log(">> to default");
      // what ever happened, if there's no user, nothing can happen!
      presenterName = this.default;
    } else if (!inputDataForWorkflow.batch && inputDataForWorkflow.labware) {
      console.log(">> to selection_page_presenter");
      presenterName = "selection_page_presenter";
    } else {
      presenterName = this.getNextPresenterName(inputDataForWorkflow.batch);
    }



//    else {
//
//      if (inputDataForWorkflow.hasOwnProperty("batch") && inputDataForWorkflow.batch) {
//        batch = inputDataForWorkflow.batch;
//      } else if (inputDataForWorkflow.hasOwnProperty("labware") && inputDataForWorkflow.labware) {
//        // get batch from labwareUUID...
////        batch = {
////          items:{
////            "tube_to_be_extracted":[
////              {
////                "uuid":"f1628770-6c81-0130-e02d-282066132de2",
////                "status":"ready",
////                "batch":null
////              }
////            ]
////          }
////        };
//      }






    return this.getNextPresenterFromName(presenterFactory, presenterName);

//
//    if (!inputDataForWorkflow.userUUID) {
//      return this.getNextPresenterFromName("default");
//    }
//
//    if (inputDataForWorkflow.HACK) {
//      return this.getNextPresenterFromName("binding_complete_page");
//
//    }
//
//    if (inputDataForWorkflow.batchUUID) {
//      return this.getNextPresenterFromName("kit_presenter_page");
//    }
//
//    if (inputDataForWorkflow.labwareUUID) {
//      return this.getNextPresenterFromName("selection_page_presenter");
//    }
//
//    return this.getNextPresenterFromName("default");

  };


  return workflowEngine;
});
