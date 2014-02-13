define([ 'text!pipeline_config-DO_NOT_DIRECTLY_EDIT.json' ], function (pipelineJSON) {

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

  var getMatchingRoleDataFromItems = function (items) {
    var items = itemFilterOnStatus(items, 'done');
    if (items.length === 0){
      // no 'done' role <=> spent batch
      setTimeout(function() {
        //TODO: Reloads page if batch spent. This should be properly managed with error message.
        // A better solution could be avoiding the lost of user credentials at the end of a pipeline.
        var href = window.location.href;
        window.location.href = href;
      }, 3000);
      return pipelineConfig['spentBatch'];
    }

    var activeRole     = _.chain(pipelineConfig.role_priority).find(firstMatchingRoleOnItems(items)).value();

    var foundWorkflows = pipelineConfig.workflows.filter(function(workflow) {
      return workflow.accepts === activeRole;
    });

    // no controller to deal with this role -> summary page
    if(foundWorkflows.length < 1){
      foundWorkflows.push(pipelineConfig.unknownRole);
    }

    // I've made a terrible mistake!
    if (foundWorkflows.length > 1) throw "More than 1 workflow active. Please contact administrator.";

    return foundWorkflows[0];
  };


  var nextWorkflow = function(model) {
    var itemsPromise;

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

