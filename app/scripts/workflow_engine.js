define(['config'
  , 'mapper/s2_root'
], function (config, S2Root) {

  var workflowEngine = function (owner, config) {

    this.mainController = owner;
    this.default = config["default"];
    this.rules = config["rules"];
  };

  workflowEngine.prototype.getNextPresenterName = function (inputDataForWorkflow) {
    /**
     * inputDataForWorkflow is a batch
     */
    var that = this;
    var presenterName = null;

    $.each(that.rules, function (ruleName, rule) {
//      console.log("rule : ",rule);
      $.each(inputDataForWorkflow.items, function (roleName, role) {
//        console.log(">>> role : ", roleName, " > ",role);
        $.each(role, function (itemIndex, item) {
//          console.log(">>>>>>> item : ", item);
          if (item.status === "ready") {
            if (rule[0] === roleName) {
              presenterName = rule[1];
              return false;
            }
          }
        });
        if (presenterName) {
          return false;
        } // allows to break to the loop as soon as we know...
      });
      if (presenterName) {
        return false;
      } // allows to break to the loop as soon as we know...
    });
    if (!presenterName)
      presenterName = this.default;
    return presenterName;
  };

  workflowEngine.prototype.getNextPresenterFromName = function (presenterFactory, presenterName) {
    switch (presenterName) {
      case "binding_complete_page":
        return presenterFactory.createBindingCompletePage(this.mainController);
      case "kit_presenter_page":
        return presenterFactory.createKitPresenter(this.mainController);
      case "selection_page_presenter":
        return presenterFactory.createSelectionPagePresenter(this.mainController);
      default:
        return presenterFactory.createDefaultPresenter(this.mainController);
    }
  };


  workflowEngine.prototype.getNextPresenter = function (presenterFactory, inputDataForWorkflow) {
    var batch = undefined;
    var presenterName = undefined;

    if (!inputDataForWorkflow.userUUID) {
      // what ever happened, if there's no user, nothing can happen!
      batch = {items:{}};
    } else {

      if (inputDataForWorkflow.hasOwnProperty("batchUUID") && inputDataForWorkflow.batchUUID) {
        // get batch from bathcUUID...
        batch = {
          items:{
            "tube_to_be_extracted":[
              {
                "uuid":"f1628770-6c81-0130-e02d-282066132de2",
                "status":"ready",
                "batch":null
              }
            ]
          }
        };
      } else if (inputDataForWorkflow.hasOwnProperty("labwareUUID") && inputDataForWorkflow.labwareUUID) {
        // get batch from labwareUUID...
        batch = {
          items:{
            "tube_to_be_extracted":[
              {
                "uuid":"f1628770-6c81-0130-e02d-282066132de2",
                "status":"ready",
                "batch":null
              }
            ]
          }
        };
      }


    }


    presenterName = this.getNextPresenterName(batch);

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
