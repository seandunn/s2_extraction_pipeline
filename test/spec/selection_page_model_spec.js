define([
  'config'
  , 'mapper/s2_root'
  , 'models/selection_page_model'
  , 'text!testjson/unit/root.json'
  , 'text!pipelinetestjson/selection_page_model_test_data.json'
], function (config, S2Root, Model, rootTestData, testData) {

  'use strict';

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
    childDone:function(){
    }
  };

  var initData = {
    "input": "samples.extraction.manual.dna_and_rna.input_tube_nap",
    "output": {
      "tube": "samples.extraction.manual.dna_and_rna.binding_input_tube_nap"
    },
    "presenter":{
      "presenter_name":"selection_page_presenter",
      "default_printer":{
        "name":"",
        "description":"",
        "url":"http://localhost:9999"
      }
    }
  };

  describe("Selection page model", function () {

    var m = Object.create(Model).init(fakeOwner, initData);

    it("can add a seminal labware, and then contains one tube", function () {
      spyOn(fakeOwner,"childDone");
      getAResource(fakeOwner,"tube1_UUID").then(function (tube) {
        expect(tube.uuid).toEqual("tube1_UUID");
        m.setSeminalLabware(tube);
        expect(m.tubes.length).toEqual(1);
        expect(m.tubes[0].uuid).toEqual("tube1_UUID");
        expect(fakeOwner.childDone).toHaveBeenCalled();
      }).fail(function () {
            throw "oops"
          });
    });

    it("can make a batch", function () {

      spyOn(config,"ajax").andCallThrough();
      fakeOwner.childDone = function (){
        expect(config.ajax).toHaveBeenCalled();
      };
      spyOn(fakeOwner,"childDone");
      m.makeBatch();
      expect(fakeOwner.childDone).toHaveBeenCalled();
    });
  });

  describe("Selection page model", function () {

    var m = Object.create(Model).init(fakeOwner, initData);

    it("can add a tube only once", function () {
      spyOn(fakeOwner,"childDone");
      getAResource(fakeOwner,"tube1_UUID").then(function (tube) {
        expect(tube.uuid).toEqual("tube1_UUID");
        expect(function(){m.addTube(tube)}).not.toThrow();
        expect(function(){m.addTube(tube)}).toThrow();
      }).fail(function () {
            throw "oops"
          });
    });

  });

});
