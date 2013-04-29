define(['scripts/workflow_engine'
      , 'config'
      , 'text!scripts/pipeline_config.json'
], function (WorkflowEngine, config, testData) {
  'use strict';

  describe("WorkflowEngine:-",function(){
    var testConfig, workflowEngine, activeWorkflow;

    beforeEach(function(){
      testConfig     = $.parseJSON(testData);
      workflowEngine = new WorkflowEngine(undefined, testConfig);
    });

    describe("Loading the workflow,", function(){
      it("is instantiated.", function () {
        expect(workflowEngine).toBeDefined();
      });

      it("an askForNextPresenter method.", function () {
        expect(typeof workflowEngine.askForNextPresenter).toEqual("function");
      });

      it("has a role priority array.", function () {
        expect(workflowEngine.role_priority instanceof Array).toBe(true);
      });


      it("has a defaultPresenter attribute.", function(){
        expect(workflowEngine.defaultPresenter).toBeDefined();
      });


      describe("A formed pipeline_config.json file,", function(){
        it("has a matching number of roles and rolePriority entries.", function(){
          expect(workflowEngine.role_priority.length).toEqual(_.keys(workflowEngine.workflows).length);
        });

        it("has role_priority entries which are strings.", function () {
          expect(typeof workflowEngine.role_priority[0]).toEqual("string");
        });

        it("has a matching role to each 'accepts' property", function(){
          _.each(workflowEngine.role_priority,function(rolePriority){
            var accepts = 0;
            var rp = rolePriority;
            _.each(workflowEngine.workflows,function(workflows){
              _.each(workflows.accepts,function(role){
                if(rp === role){
                  accepts ++;
                }
              })
            })
            expect(rp+" has "+accepts+" entries").toEqual(rp+" has "+1+" entries");
          })

        });
      });
    });

    describe("Passing in an empty set of roles,", function (){

      beforeEach(function(){
        activeWorkflow = workflowEngine.getMatchingRoleDataFromItems([]);
      });

      it("returns the default presenter.", function(){
        expect(activeWorkflow.presenterName).toEqual("default_presenter");
      });
    });

    describe("Looking up a presenter for a manual DNA+P tube,", function (){
      beforeEach(function(){
        activeWorkflow = workflowEngine.getMatchingRoleDataFromItems([{
          "uuid":    "UUID_FOR_DNAP_TUBE",
          "status":  "done",
          "role":    "samples.extraction.manual.dna_and_rna.input_tube_nap"
        }]);
      });

      it("returns the default presenter.", function(){
        expect(activeWorkflow.presenterName).toEqual("selection_page_presenter");
      });
    });

    describe("Processing a workflow that accepts multiple role types,", function(){
    });

  });


});

