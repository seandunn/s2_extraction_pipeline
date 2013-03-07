define(['models/selection_page_model', 'spec/selection_page_helper', 'extraction_pipeline/dummyresource'], function (SelectionPageModel, SelectionPageHelper, DummyResource) {

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
        model = new SelectionPageModel(owner, 123456789);
        haveMutated = false;
      });

      it("has capacity of 12 tubes", function () {
        expect(model.getCapacity()).toEqual(12);
      });

      it("has no batch identifier", function () {
        expect(model.batch).toBeUndefined();
      });

      it("has batch identifier set after a tube has been added", function () {
        var expectedBatchUuid = firstBatchUuid;
        nextBatchUuid = firstBatchUuid;
        runs(function () {
          model.addTube(helper.createUuid(0), barcodePresenter);
        });

        waitsFor(function () {
          return haveMutated;
        }, "mutator to run", 100);

        runs(function () {
          expect(model.batch).toEqual(firstBatchUuid);
        });
      });

      it("adding tube with no batch is handled gracefully", function () {
        // TODO
        nextBatchUuid = '';
        model.addTube(helper.createUuid(0));
        expect(model.batch).toBeUndefined();
      });

    });

    describe("model with 1 tube", function () {
      var model;

      beforeEach(function () {
        createSpyOwner();
        model = new SelectionPageModel(owner, 123456789);
        model.tubes.push(helper.createTubeWithOriginalBatch(0));
        model.batch = firstBatchUuid;
        haveMutated = false;
      });

      it("contains one tube", function () {
        expect(model.getNumberOfTubes()).toEqual(1);
      });

      it("adding new tube in same batch works fine", function () {

        runs(function () {
          haveMutated = false;
          nextBatchUuid = firstBatchUuid;
          var uuid = helper.createUuid(1);
          // Set up override uuid
          nextObjectUuid = uuid;
          model.addTube(uuid);
        });
        waitsFor(function () {
              return haveMutated;
            },
            "2 tubes to be created",
            50);
        runs(function () {
          expect(model.getNumberOfTubes()).toEqual(2);
          expect(model.tubes[0].rawJson.tube.uuid).not.toEqual(model.tubes[1].rawJson.tube.uuid);
        });
      });

      it("tube in different batch not added to model and sends error message to childDone", function () {
        runs(function () {
          nextBatchUuid = secondBatchUuid;
          model.addTube(helper.createUuid(1), barcodePresenter);
        });
        waitsFor(function () {
              return haveMutated;
            },
            "The mutator to override the batch uuid",
            40);
        runs(function () {
          expect(model.getNumberOfTubes()).toBe(1);
          expect(owner.childDone).toHaveBeenCalledWith(barcodePresenter, "error",
              {"type":"UuidMismatch", "message":"Tube in different batch to currently selected tubes."});
        });
      });

      it("removing last tube causes batch to be undefined", function () {
        var uuid = helper.getUuidFromTube(model.tubes[0]);
        model.removeTubeByUuid(uuid);
        expect(model.getNumberOfTubes()).toEqual(0);
        expect(model.batch).toBeUndefined();
      });

      it("attempting to add same tube again sends error message to parent", function () {
        runs(function () {
          nextBatchUuid = firstBatchUuid;
          nextObjectUuid = helper.createUuid(0);
          model.addTube(helper.createUuid(0), barcodePresenter);
        });
        waitsFor(function () {
              return haveMutated;
            },
            "The mutator to have overriden the batch id",
            40);
        runs(function () {
          expect(model.getNumberOfTubes()).toBe(1);
          expect(owner.childDone).toHaveBeenCalledWith(barcodePresenter, "error",
              {"type":"UuidMismatch", "message":"This tube has already been scanned."});
        });

      });
    });

    describe("model with 12 tubes", function () {
      var model;

      beforeEach(function () {
        createSpyOwner();
        model = new SelectionPageModel(owner, 123456789);
        for (var i = 0; i < 12; i++) {
          var newTube = helper.createTubeWithOriginalBatch(i);

          model.tubes.push(newTube);
        }
      });

      it("contains 12 tubes", function () {
        expect(model.getNumberOfTubes()).toEqual(12);
      });

      it("remove tubes removes tube order and leaves batch defined", function () {
        var uuid = helper.getUuidFromTube(model.tubes[5]);
        var originalBatch = model.batch;
        model.removeTubeByUuid(uuid);
        expect(model.getNumberOfTubes()).toEqual(11);
        for (var i = 0; i < 11; i++) {
          var tube = model.tubes[i];
          expect(tube).toBeDefined();
          expect(helper.getUuidFromTube(tube)).not.toEqual(uuid);
        }

        expect(model.batch).toEqual(originalBatch);

      });

      it("attempting to remove an tube with no matching uuid leaves model unchanged", function () {
        var uuid = helper.createUuid(20);
        model.removeTubeByUuid(uuid);

        expect(model.getNumberOfTubes()).toEqual(12);
      });

      it("adding new tube in different batch throws exception", function () {
        var tube = helper.createTubeWithDifferentBatch(12);
        expect(function () {
          model.addTube(order);
        }).toThrow();
      });

      it("adding new tube in same batch throws exception", function () {
        var tube = helper.createTubeWithOriginalBatch(12);
        expect(function () {
          model.addTube(tube);
        }).toThrow();
      });

      it("can return uuid from tube index", function () {
        for (var i = 0; i < model.getNumberOfTubes(); i++) {
          var expectedUuid = helper.createUuid(i);
          expect(model.getTubeUuidFromTubeIndex(i)).toBe(expectedUuid);
        }
      });
    })
  });

});
