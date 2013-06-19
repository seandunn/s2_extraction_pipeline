define([
  'config'
  , 'mapper_test/resource_test_helper'
  , 'mapper/s2_root'
  , 'models/selection_page_model'
  , 'text!mapper_testjson/unit/root.json'
  , 'text!pipeline_testjson/selection_page_model_test_data.json'
], function (config, TestHelper, S2Root, Model, rootTestData, testData) {
  'use strict';

  TestHelper(function (results) {

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
      childDone:function () {
      }
    };

  var initData = {
    "input":{
      "role":"samples.extraction.manual.dna_and_rna.input_tube_nap",
      "model":"tube"
    },
    "output":[{
      "role":"samples.extraction.manual.dna_and_rna.binding_input_tube_nap",
      "aliquotType":"RNA+P",
      "purpose":"stock",
      "model":"tube"
    }],
    "presenter_name":"selection_page_presenter",
    "behaviours": {
      "transfer": "row_by_row",
      "complete": "page_complete"
    }
  };

    describe("Selection page model", function () {
      var tube, model, modelPromise, inputs;
      beforeEach(function(){
        modelPromise = Object.create(Model).init(fakeOwner, initData);

        runs(function(){

          results.resetFinishedFlag();
          getAResource(fakeOwner, "tube1_UUID")
              .then(results.assignTo('tube1'))
              .then(results.expected)
              .fail(results.unexpected);
        });

        waitsFor(results.hasFinished);

        runs(function(){
          results.resetFinishedFlag();
          tube = results.get('tube1');
          modelPromise
              .then(results.assignTo('model'))
              .then(results.expected)
              .fail(results.unexpected);
        });

        waitsFor(results.hasFinished);

        runs(function(){
          results.resetFinishedFlag();
          model = results.get('model');
          model.setup({labware:tube});
          model.inputs
              .then(results.assignTo('inputs'))
              .then(results.expected)
              .fail(results.unexpected);
        });

        waitsFor(results.hasFinished);

      });

      it("can add a labware, and then contains one tube", function () {
          expect(tube.uuid).toEqual("tube1_UUID");
          inputs = results.get('inputs');

        expect(inputs.length).toEqual(1);
          expect(inputs[0].uuid).toEqual("tube1_UUID");
      });
    });
  });
});
