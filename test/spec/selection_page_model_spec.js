define(['models/selection_page_model', 'spec/selection_page_helper'], function (SelectionPageModel, SelectionPageHelper) {

  'use strict';

  var firstBatchUuid = '11111111-222222-00000000-111111111111';
  var secondBatchUuid = '11111111-222222-00000000-111111111112';
  var nextObjectUuid = '';
  var nextBatchUuid = '';
  var haveMutated = false;
  var owner = null;
  var barcodePresenter = {}; // minimal mock is acceptable

  DummyResource.prototype.mutateJson = function (json) {

    json.tube.uuid = nextObjectUuid;
    if (nextBatchUuid !== '') {
      json.tube.batch = {
        rawJson:{
          uuid:nextBatchUuid
        }
      };
    }
    haveMutated = true;

    return json;

  }

  var createSpyOwner = function () {
    owner = {
      childDone:function (child, action, data) {
      }
    };
    spyOn(owner, 'childDone');
  }


  describe("SelectionPageModel", function () {

    var helper = new SelectionPageHelper();

    describe("model with 0 tubes", function () {
      var model;

      beforeEach(function () {
        createSpyOwner();
        var inputModel = {
          userUUID:null,
          labwareUUID:null,
          batchUUID:null
        }
        model = new SelectionPageModel(owner, inputModel);
        haveMutated = false;
      });

      it("has capacity of 12 tubes", function () {
        expect(model.getCapacity()).toEqual(12);
      });
    });


    describe("model with 1 tube", function () {
      var model;

      beforeEach(function () {
        createSpyOwner();
        var inputModel = {
          userUUID:null,
          labwareUUID:"2345678901234",
          batchUUID:null
        }
        model = new SelectionPageModel(owner, inputModel);
        model.retrieveBatchFromSeminalLabware();
      });

      it("contains one tube", function () {
        expect(model.getNumberOfTubes()).toEqual(1);
      });

      it("can add a new tube", function () {
        model.addTube("1234567890");
        expect(model.getNumberOfTubes()).toEqual(2);
      });

      xit("attempting to add same tube again sends error message to parent", function () {
          model.addTube("2345678901234");
        expect(model.getNumberOfTubes()).toBe(1);
        expect(owner.childDone).toHaveBeenCalledWith(barcodePresenter, "error",
            {"type":"UuidMismatch", "message":"This tube has already been scanned."});
      });

    });

  describe("model with 12 tubes", function () {
    var model;

    beforeEach(function () {
      createSpyOwner();
      var inputModel = {
        userUUID:null,
        labwareUUID:null,
        batchUUID:null
      }
      model = new SelectionPageModel(owner, inputModel);
      for (var i = 0; i < 12; i++) {
        model.addTube("1234567890" + i);
      }
    });

    it("contains 12 tubes", function () {
      expect(model.getNumberOfTubes()).toEqual(12);
    });

    it("attempting to remove an tube with no matching uuid leaves model unchanged", function () {
      model.removeTubeByUuid("12300000");

      expect(model.getNumberOfTubes()).toEqual(12);
    });
  })
});

})
;
