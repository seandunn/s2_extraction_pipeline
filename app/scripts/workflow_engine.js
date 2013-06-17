define([ 'text!scripts/pipeline_config.json' ], function (pipelineJSON) {

  var pipelineConfig = JSON.parse(pipelineJSON);

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

  var getMatchingRoleDataFromItems = function (items) {
    var activeRole     = _.chain(pipelineConfig.role_priority).find(itemMatcherForBatchItems(items)).value();
    var foundWorkflows = pipelineConfig.workflows.filter(byRole(activeRole));

    if (foundWorkflows.length > 1) throw "More than 1 workflow active.";

    return foundWorkflows[0] || { presenterName: pipelineConfig.defaultPresenter };
  };


  var nextWorkflow = function(model) {
    var itemsPromise;

    if (!model.user) return $.Deferred().resolve().promise();

    if (!model.batch && model.labware) {
      itemsPromise = model.labware.order().then(function(order) {
        return order.items.filter(function(item){
          return item.uuid === model.labware.uuid;
        });
      });
    } else {
      itemsPromise = model.batch.items;
    }

    return itemsPromise.then(getMatchingRoleDataFromItems);
  };

  return nextWorkflow;
});

