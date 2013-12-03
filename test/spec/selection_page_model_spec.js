/* global describe, it, expect, beforeEach */
define([
  "config",
  "mapper_test/resource_test_helper",
  "mapper/s2_root",
  "models/selection_page_model",
  "text!mapper_testjson/unit/root.json",
  "text!pipeline_testjson/selection_page_model_test_data.json"
], function (config, testHelper, S2Root, SelectionPageModel, rootTestData, testData) {
  "use strict";

  testHelper(function (results) {

    function getAResource(owner, uuid) {
      var deferredS2Resource = new $.Deferred();
      owner.getS2Root()
        .then(function (root) {
          return root.find(uuid);
        }).then(function (result) {
          deferredS2Resource.resolve(result);
        }).fail(function () {
          deferredS2Resource.reject();
        });
      return deferredS2Resource.promise();
    }

    config.loadTestData(testData);
    config.cummulativeLoadingTestDataInFirstStage(rootTestData);

    var fakeOwner = {
      getS2Root:function () {
        var deferredS2Root = new $.Deferred();
        if (!this.s2Root) {
          var that = this;

          S2Root.load({user:"username"}).done(function (result) {
            that.s2Root = result;
            deferredS2Root.resolve(result);
          }).fail(function () {
              deferredS2Root.reject();
            });
        } else {
          deferredS2Root.resolve(this.s2Root);
        }
        return deferredS2Root.promise();
      },
      childDone:function () {}
    };

    var initData = {
      "input": {
        "role":"samples.extraction.manual.dna_and_rna.input_tube_nap",
        "model":"tube"
      },
      "output":[{
        "role":"samples.extraction.manual.dna_and_rna.binding_input_tube_nap",
        "aliquotType":"RNA+P",
        "purpose":"stock",
        "model":"tube"
      }],
      "controller_name":"selection_page_controller",
      "behaviours": {
        "transfer": "row_by_row",
        "complete": "page_complete"
      }
    };

    describe.skip("Selection page model", function () {
      var tube, model, modelPromise, inputs;
      
      beforeEach(function(done){

        results.resetFinishedFlag();

        getAResource(fakeOwner, "tube1_UUID")
          .then(results.assignTo("tube1"))
          .then(results.expected)
          .fail(results.unexpected)
          .always(done);
      });

      beforeEach(function(done) {
        modelPromise = Object.create(SelectionPageModel).init(fakeOwner, initData);
        results.resetFinishedFlag();
        
        tube = results.get("tube1");
        
        modelPromise
          .then(results.assignTo("model"))
          .then(results.expected)
          .fail(results.unexpected)
          .always(done);
      });

      beforeEach(function(done) {
        results.resetFinishedFlag();
        model = results.get("model");
        model.setup({labware:tube});
        model.inputs
            .then(results.assignTo("inputs"))
            .then(results.expected)
            .fail(results.unexpected)
            .always(done);
      });

      it("can add a labware, and then contains one tube", function () {
        expect(tube.uuid).to.equal("tube1_UUID");
        inputs = results.get("inputs");

        expect(inputs.length).to.equal(1);
        expect(inputs[0].uuid).to.equal("tube1_UUID");
      });
    });
  });
});