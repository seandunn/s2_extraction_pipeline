define(['scripts/default/default_model'
  , 'config'
  , 'mapper/s2_root'
  , 'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction/1.json'
], function (DefaultModel, config, S2Root, dataJSON) {
  'use strict';

  describe("DefaultModel", function () {

    describe("default initialisation", function () {

      var defaultModel = Object.create(DefaultModel);

      it("model can be instanciated", function () {
        expect(defaultModel).toBeDefined();
      });

    });


    describe("labware can be handled", function () {

      var defaultModel = undefined;
      var owner = undefined;

      var getS2RootFunc = function (that) {
        var deferredS2Root = new $.Deferred();
        if (!that.s2Root) {
          config.setupTest(dataJSON); // TODO: remove this line to activate the real mapper
          S2Root.load({user:"username"}).done(function (result) {
            console.log("loaded");
            that.s2Root = result;
            deferredS2Root.resolve(result);
          }).fail(function () {
              deferredS2Root.reject();
            });
        } else {
          deferredS2Root.resolve(that.s2Root);
        }
        return deferredS2Root.promise();
      };


      beforeEach(function () {
        defaultModel = Object.create(DefaultModel);
        owner = {};
        owner.getS2Root = jasmine.createSpy('getS2Root').andReturn(getS2RootFunc(owner));
        owner.childDone = function () {
        };
        defaultModel.init(owner);
        spyOn(owner, 'childDone');
      });

      it("when a tube is added, the model sends back the msg 'modelUpdated' with the tube.", function () {
        defaultModel.setLabwareFromBarcode("1220017279667")
          .then(function () {
            expect(owner.getS2Root).toHaveBeenCalled();
            expect(Object.keys(defaultModel.stash_by_BC).length).toEqual(1);
            expect(owner.childDone).toHaveBeenCalledWith(defaultModel, "modelUpdated", defaultModel.stash_by_BC["1220017279667"]);
          });
      });

      it("handles a case where a labware barcode is not found", function () {
        defaultModel.setLabwareFromBarcode("NOT_VALID");
        expect(owner.getS2Root).toHaveBeenCalled();

      });

      it("does not find a tube from incorrect BC, and handles this appropriately", function () {
        var promise = defaultModel.fetchResourcePromiseFromBarcode("NOT_A_BARCODE");
        expect(promise.state()).toEqual("rejected");
      });


      it("model is validated correctly", function () {
        // TODO: check this test

        defaultModel.labware = {
          order:function () {
            return new $.Deferred().reject().promise();
          }
        };
        defaultModel.user = "DUMMY_USER";
        defaultModel.checkIfModelIsValid();

        expect(owner.childDone).toHaveBeenCalledWith(defaultModel, "modelValidated");
      });
    });
  });
})
;
