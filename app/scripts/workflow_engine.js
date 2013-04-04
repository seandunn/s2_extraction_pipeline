define(['config'
  , 'mapper/s2_root'
], function (config, S2Root) {

  var workflowEngine = function (owner, config) {

    this.mainController = owner;
    this.default = config["default_presenter"];
    this.role_priority = config["workflow"]["role_priority"];
    this.role_configuration = config["workflow"]["role_configuration"];
  };

  // Returns a function that finds the first "ready" item in the batch that matches the given rule.
  function itemMatcherForBatchItems(items) {
    console.log("mathc items",items);
    return function (rule) {
      console.log("*****",rule);
      return _.chain(items)
          .filter(function (item) {
            console.log("?? ",item);
            return item.status === 'done';
          })
          .filter(function (item) {
            console.log("rule ",rule);
            return item.role === rule;
          })
          .first()
          .value();
    };
  }

  workflowEngine.prototype.getNextPresenterName = function (batch) {
    /**
     * inputDataForWorkflow is a batch
     */
    var deffered = $.Deferred();

    console.log("\n\n\n==================================\n\n\n");

    var items;
    var that = this;
    console.log("gN batch : ",batch);
    batch.items.then(function (result) {
      items = result;
      console.log("gN items : ",items);
      console.log(that.role_priority);
      var matchingRole = _.chain(that.role_priority).find(itemMatcherForBatchItems(items)).value();
      console.log("gN presenterRule : ",matchingRole);
//      debugger;


      deffered.resolve(matchingRole ? that.role_configuration[matchingRole]["presenter"]["presenter_name"] : this.default);
    }).fail(function(){
          deffered.reject();
    });



    return deffered.promise();
  };

  workflowEngine.prototype.setNextPresenterFromName = function (presenterFactory, presenterName) {
    var presenter = null;
    switch (presenterName) {
      case "binding_complete_page":
        presenter = presenterFactory.createBindingCompletePage(this.mainController);
        break;
      case "kit_presenter":
        presenter = presenterFactory.createKitBindingPagePresenter(this.mainController, {});
        break;
      case "selection_page_presenter":
        presenter = presenterFactory.createSelectionPagePresenter(this.mainController);
        break;
      case "binding_finished_page_presenter":
        presenter = presenterFactory.createBindingFinishedPage(this.mainController);
        break;
      case "elution_loading_page_presenter":
        presenter = presenterFactory.createElutionLoadingPage(this.mainController);
        break;
      case "elution_wash_page_presenter":
        presenter = presenterFactory.createElutionWashPage(this.mainController);
        break;
      default:
        presenter = presenterFactory.createDefaultPresenter(this.mainController);
    }
    this.mainController.childDone(this, "foundNextPresenter", presenter);
  };

  workflowEngine.prototype.askForNextPresenter = function (presenterFactory, inputDataForWorkflow) {
    if (!inputDataForWorkflow.userUUID) {
      console.log(">> to default");
      this.setNextPresenterFromName(presenterFactory, this.default);
    } else if (!inputDataForWorkflow.batch && inputDataForWorkflow.labware) {
      console.log(">> to selection_page_presenter");
      this.setNextPresenterFromName(presenterFactory, "selection_page_presenter");
    } else {
      var that = this;
      this.getNextPresenterName(inputDataForWorkflow.batch).then(function (presenterName) {
        console.log(">> to getNextPresenterName :  ", presenterName);
        that.setNextPresenterFromName(presenterFactory, presenterName);
      });
    }
  };

  return workflowEngine;
});
