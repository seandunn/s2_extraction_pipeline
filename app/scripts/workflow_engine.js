define([ 'text!scripts/pipeline_config.json' ], function (pipelineJSON) {

  var pipelineConfig = JSON.parse(pipelineJSON);

  function itemFilterOnStatus(items,status){
    return _.filter(items,function (item) {
      return item.status === status;
    });
  }

  // Returns a function that finds the first "ready" item in the batch that matches the given rule.
  function firstMatchingRoleOnItems(items) {
    return function (role) {
      return _.chain(items).filter(function (item) {
        return item.role === role;
      }).first().value();
    }
  }

  function byRole(activeRole){
    return function(workflow){
      return _.find(workflow.accepts, function(role){ return role === activeRole; });
    };
  }

  var getMatchingRoleDataFromItems = function (items) {
    var items = itemFilterOnStatus(items, 'done');
    if (items.length === 0){
      // no 'done' role <=> spent batch
      return pipelineConfig['spentBatch'];
    }

    var activeRole     = _.chain(pipelineConfig.role_priority).find(firstMatchingRoleOnItems(items)).value();

    var foundWorkflows = pipelineConfig.workflows.filter(byRole(activeRole));

    // no presenter to deal with this role -> summary page
    if(foundWorkflows.length < 1){
      foundWorkflows.push(pipelineConfig.unknownRole);
    }

    if (foundWorkflows.length > 1) throw "More than 1 workflow active.";

    return foundWorkflows[0];
  };


  var nextWorkflow = function(model) {
    var itemsPromise;

    if (!model.user) return $.Deferred().resolve().promise();
    if (!model.batch && !model.labware) return $.Deferred().resolve().promise();
    if (!model.batch) {
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

