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
    var items;
    var that = this;
    batch.items.then(function (result) {
      items = result;
      var matchingRole = _.chain(that.role_priority).find(itemMatcherForBatchItems(items)).value();
      var presenterName = matchingRole ? that.role_configuration[matchingRole]["presenter"]["presenter_name"] : this.default;
      var presenterInitData = matchingRole ? that.role_configuration[matchingRole] : {};
      deffered.resolve({presenterName:presenterName, initData:presenterInitData});
    }).fail(function(){
          deffered.reject();
    });



    return deffered.promise();
  };

  workflowEngine.prototype.setNextPresenterFromName = function (presenterFactory, presenterName, initData) {
    var presenter = null;
    switch (presenterName) {
      case "kit_presenter":
        presenter = presenterFactory.createKitBindingPagePresenter(this.mainController, initData);
        break;
      case "selection_page_presenter":
        presenter = presenterFactory.createSelectionPagePresenter(this.mainController);
        break;
      case "binding_finished_page_presenter":
        presenter = presenterFactory.createBindingFinishedPage(this.mainController);
        break;
      case "elution_page_presenter":
        presenter = presenterFactory.createElutionPage(this.mainController);
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
      this.getNextPresenterName(inputDataForWorkflow.batch).then(function (data) {
        console.log(">> to getNextPresenterName :  ", data.presenterName);
        that.setNextPresenterFromName(presenterFactory, data.presenterName, data.initData
        );
      });
    }
  };

  return workflowEngine;
});
