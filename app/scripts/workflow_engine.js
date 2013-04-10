define([], function () {

  var workflowEngine = function (owner, config) {
    this.mainController     = owner;
    this.defaultPresenter   = config.defaultPresenter;
    this.role_priority      = config.workflow.role_priority;
    this.role_configuration = config.workflow.role_configuration;
  };

  // Returns a function that finds the first "ready" item in the batch that matches the given rule.
  function itemMatcherForBatchItems(items) {
    return function (role) {
      return _.chain(items).filter(function (item) {
        return item.status === 'done';
      }).filter(function (item) {
        return item.role === role;
      }).first().value();
    };
  }

  workflowEngine.prototype.getMatchingRoleDataFromItems = function (items) {
    var matchingRole      = _.chain(this.role_priority).find(itemMatcherForBatchItems(items)).value();
    var presenterName     = matchingRole? this.role_configuration[matchingRole].presenterName : this.defaultPresenter;
    var presenterInitData = matchingRole? this.role_configuration[matchingRole] : {};

    return {presenterName:presenterName, initData:presenterInitData};
  };

  workflowEngine.prototype.getNextPresenterNameWithoutBatch = function (data) {
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
    var deffered = $.Deferred();
    var that     = this;
    data.batch.items.then(function (items) {
      var matchingRoleData = that.getMatchingRoleDataFromItems(items);
      deffered.resolve(matchingRoleData);
    }).fail(function () {
      deffered.reject();
    });

    return deffered.promise();
  };

  workflowEngine.prototype.setNextPresenterFromName = function (presenterFactory, presenterName, initData) {
    var presenter = presenterFactory.create(presenterName, this.mainController, initData);
    this.mainController.childDone(this, "foundNextPresenter", presenter);
  };

  workflowEngine.prototype.askForNextPresenter = function (presenterFactory, inputDataForWorkflow) {
    var that = this;
    if (!inputDataForWorkflow.userUUID) {
      this.setNextPresenterFromName(presenterFactory, this.defaultPresenter);

    } else if (!inputDataForWorkflow.batch && inputDataForWorkflow.labware) {

      this.getNextPresenterNameWithoutBatch(inputDataForWorkflow)
      .then(function (data) {
        that.setNextPresenterFromName(presenterFactory, data.presenterName, data.initData);
      });

    } else {

      this.getNextPresenterNameWithBatch(inputDataForWorkflow)
      .then(function (data) {
        that.setNextPresenterFromName(presenterFactory, data.presenterName, data.initData);
      });
    }
  };

  return workflowEngine;
});
