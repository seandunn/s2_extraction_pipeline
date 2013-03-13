define(['config'
  , 'mapper/s2_root'
  , 'mapper/s2_resource_factory'
  , 'text!scripts/pipeline_config.json'
], function (config, S2Root, S2RscFactory, pipelineConfig) {

  var workflowEngine = function (owner, config) {
    this.mainController = owner;
    this.rules = $.parseJSON(config);
  };

  workflowEngine.prototype.getNextPresenter = function (presenterFactory, inputDataForWorkflow) {
    /**
     * data = {
     *   userUUID: "1234567890",
     *   batchUUID: "1234567890"
     * }
     */
    var that = this;
    var ruleApplies = function (rule, role, item) {
      console.log(rule.description);
      console.log(rule, item);
      if (rule.role != role)
        return false;
      for(var elmt in rule.needed){
        if (rule.needed[elmt] != item[elmt])
          return false;
      }
      return true;
    };


    var getPresenter = function (items) {

      if (!items) {
        return that.specialRules["no_item_rule"].result;
      }

      var presenter = null;
      //$.each(items, function(index, item){
      for (var ruleName in that.rules) {
        for (var itemRole in items) {
          for (var indexItem = 0; indexItem < items[itemRole].length; indexItem++) {

            if (ruleApplies(that.rules[ruleName], itemRole, items[itemRole][indexItem])) {
              return that.rules[ruleName].result;
            }

          }
        }
      }


      //});
//      for (var ruleName in that.rules) {
//        var rule = that.rules[ruleName];
//        console.log("rule:", ruleName);
//
//        for (var role in items) {
//          for (var i = 0; i < items[role].length; i++) {
//            var item = items[role][i];
//            console.log(">>", item);
//
//
//            if (ruleApplies(rule, role, item)) {
//              console.log(" > " + rule + " & " + item);
//              return rule.result;
//            }
//          }
//        }
//      }
      return null;
    };


    var items = {
      "tube_to_be_extracted":[
        {
          "uuid":"3bcf8010-68ac-0130-9163-282066132de2",
          "status":"done",
          "batch":{
            "actions":{
              "read":"http://localhost:9292/47608460-68ac-0130-7ac8-282066132de2",
              "create":"http://localhost:9292/47608460-68ac-0130-7ac8-282066132de2",
              "update":"http://localhost:9292/47608460-68ac-0130-7ac8-282066132de2",
              "delete":"http://localhost:9292/47608460-68ac-0130-7ac8-282066132de2"
            },
            "uuid":"47608460-68ac-0130-7ac8-282066132de2",
            "process":null
          }
        },
        {
          "uuid":"3bd0e850-68ac-0130-9163-282066132de2",
          "status":"in_progress",
          "batch":{
            "actions":{
              "read":"http://localhost:9292/47608460-68ac-0130-7ac8-282066132de2",
              "create":"http://localhost:9292/47608460-68ac-0130-7ac8-282066132de2",
              "update":"http://localhost:9292/47608460-68ac-0130-7ac8-282066132de2",
              "delete":"http://localhost:9292/47608460-68ac-0130-7ac8-282066132de2"
            },
            "uuid":"47608460-68ac-0130-7ac8-282066132de2",
            "process":null
          }
        }
      ]
    };
    console.log("---------");
    this.specialRules = $.parseJSON(pipelineConfig)["special_rules"];
    this.rules = $.parseJSON(pipelineConfig)["rules"];

    console.log(">>> ",getPresenter(items));

    if (!inputDataForWorkflow.userUUID) {
      // nobody is logged in.
      // we must show the login presenter
      return presenterFactory.createDefaultPresenter(this.mainController);
    }

    // from here, we can assume that a user has entered it's barcode, and has been
    // recognised (maybe...)


    if (inputDataForWorkflow.HACK) {
      return presenterFactory.createBindingCompletePage(this.mainController);

    }

    if (inputDataForWorkflow.batchUUID) {
      return presenterFactory.createKitPresenter(this.mainController);
    }

    if (inputDataForWorkflow.labwareUUID) {
      // todo: according to the batch, something else should happen
      // clever things should happen here...
      return presenterFactory.createSelectionPagePresenter(this.mainController);
    }

    return presenterFactory.createDefaultPresenter(this.mainController);
  };


  return workflowEngine;
});
