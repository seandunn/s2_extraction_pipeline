//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
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
      return new $.Deferred().reject("This labware is not in use anymore.");
    }

    var activeRole     = _.chain(pipelineConfig.role_priority).find(firstMatchingRoleOnItems(items)).value();

    var foundWorkflows = pipelineConfig.workflows.filter(function(workflow) {
      return workflow.accepts === activeRole;
    });

    // no controller to deal with this role -> summary page
    if(foundWorkflows.length < 1){
      foundWorkflows.push(pipelineConfig.unknownRole);
      return new $.Deferred().reject("The role selected ["+activeRole+"] was not defined in the actual workflows. Please contact administrator")
    }

    // I've made a terrible mistake!
    if (foundWorkflows.length > 1) { 
      return new $.Deferred().reject("More than 1 workflow active. Please contact administrator."); 
    }

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

