define([], function () {

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

  function byRole(activeRole){
    return function(workflow){
      return _.find(workflow.accepts, function(role){ return role === activeRole; });
    };
  }

  var workflowEngine = function (application, config) {
    this.application      = application;
    this.defaultPresenter = config.defaultPresenter;
    this.role_priority    = config.role_priority;
    this.workflows        = config.workflows;
  };

  workflowEngine.prototype.getMatchingRoleDataFromItems = function (items) {
    var activeRole     = _.chain(this.role_priority).find(itemMatcherForBatchItems(items)).value();
    var foundWorkflows = this.workflows.filter(byRole(activeRole));

    if (foundWorkflows.length > 1) throw "More than 1 workflow active.";

    return foundWorkflows[0] || { presenterName: this.defaultPresenter };
  };


  workflowEngine.prototype.nextWorkflow = function(model) {
    var that = this;
    var itemsPromise;

    if (!model.user) {
      return $.Deferred().resolve().promise();
    }

    if (!model.batch && model.labware) {
      itemsPromise = model.labware.order().then(function(order) {
        return order.items.filter(function(item){
          return item.uuid === model.labware.uuid;
        });
      });
    } else {
      itemsPromise = model.batch.items;
    }

    return itemsPromise.then(function(items){
      return that.getMatchingRoleDataFromItems(items);
    });
  };

  return workflowEngine;
});

