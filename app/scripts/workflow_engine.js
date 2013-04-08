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
    return function (role) {
      return _.chain(items)
          .filter(function (item) {
            return item.status === 'done';
          })
          .filter(function (item) {
            return item.role === role;
          })
          .first()
          .value();
    };
  }

  workflowEngine.prototype.getMatchingRoleDataFromItems = function (items) {
    var matchingRole = _.chain(this.role_priority).find(itemMatcherForBatchItems(items)).value();
    var presenterName = matchingRole ? this.role_configuration[matchingRole]["presenter"]["presenter_name"] : this.default;
    var presenterInitData = matchingRole ? this.role_configuration[matchingRole] : {};
    return {presenterName:presenterName, initData:presenterInitData};
  };

  workflowEngine.prototype.getNextPresenterNameWithoutBatch = function (data) {
    /**
     * inputDataForWorkflow is a batch
     */
    var deffered = $.Deferred();
    var items;
    var that = this;
    data.labware.order()
        .then(function (order) {
          items = order.items.filter(function(){return true;});
          var matchingRoleData = that.getMatchingRoleDataFromItems(items);
          deffered.resolve(matchingRoleData);
        }).fail(function () {
          deffered.reject();
        });

    return deffered.promise();
  };

  workflowEngine.prototype.getNextPresenterNameWithBatch = function (data) {
    /**
     * inputDataForWorkflow is a batch
     */
    var deffered = $.Deferred();
    var items;
    var that = this;
    data.batch.items
        .then(function (result) {
          items = result;
          var matchingRoleData = that.getMatchingRoleDataFromItems(items);
          debugger;
          deffered.resolve(matchingRoleData);
        }).fail(function () {
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
        presenter = presenterFactory.createSelectionPagePresenter(this.mainController, initData);
        break;
      case "elution_page_presenter":
        presenter = presenterFactory.createElutionPage(this.mainController, initData);
        break;
//      case "elution_wash_page_presenter":
//        presenter = presenterFactory.createElutionWashPage(this.mainController, initData);
//        break;
      default:
        presenter = presenterFactory.createDefaultPresenter(this.mainController);
    }
    this.mainController.childDone(this, "foundNextPresenter", presenter);
  };

  workflowEngine.prototype.askForNextPresenter = function (presenterFactory, inputDataForWorkflow) {
    var that = this;
    if (!inputDataForWorkflow.userUUID) {
      console.log(">> to default");
      this.setNextPresenterFromName(presenterFactory, this.default);

    } else if (!inputDataForWorkflow.batch && inputDataForWorkflow.labware) {

      console.log(">> to selection_page_presenter");
      this.getNextPresenterNameWithoutBatch(inputDataForWorkflow)
          .then(function (data) {
            console.log(">> to getNextPresenterName :  ", data.presenterName);
            that.setNextPresenterFromName(presenterFactory, data.presenterName, data.initData
            );
          });

    } else {

      this.getNextPresenterNameWithBatch(inputDataForWorkflow)
          .then(function (data) {
            console.log(">> to getNextPresenterName :  ", data.presenterName);
            that.setNextPresenterFromName(presenterFactory, data.presenterName, data.initData
            );
          });
    }
  };

  return workflowEngine;
});
