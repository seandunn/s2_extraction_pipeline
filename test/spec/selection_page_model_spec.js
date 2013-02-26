define(['models/selection_page_model', 'spec/selection_page_helper'], function(SelectionPageModel, SelectionPageHelper) {

  'use strict';
  
  var firstBatchUuid = '11111111-222222-00000000-111111111111';
  var secondBatchUuid = '11111111-222222-00000000-111111111112';

  describe("SelectionPageModel", function() {

    var helper = new SelectionPageHelper();

    describe("model with 0 tubes", function() {
      var model;

      beforeEach(function() { 
        model = new SelectionPageModel(123456789);
      });

      it("has capacity of 12 tubes", function() {
        expect(model.getCapacity()).toEqual(12);
      });

      it("has no batch identifier", function() {
        expect(model.batch).toBeUndefined();
      });

      it("has batch identifier set after a tube has been added", function() {
	var expectedBatchUuid = firstBatchUuid;
        model.addTube(helper.createTubeWithOriginalBatch(0));	
	expect(model.batch).toEqual(firstBatchUuid);
      });

      it("adding tube with no batch is handled gracefully", function() {
	model.addTube(helper.createTubeWithNullBatch(0));
	expect(model.batch).toBeUndefined();
	});

    });

    describe("model with 1 tube", function() {
      var model;

      beforeEach(function() { 
        model = new SelectionPageModel(123456789);

        model.addTube(helper.createTubeWithOriginalBatch(0));	
      });

      it("contains one tube", function() { 
        expect(model.getNumberOfTubes()).toEqual(1);
      });

      it("adding new tube in same batch works fine", function () {
        var tube = helper.createTubeWithOriginalBatch(1);
        model.addTube(tube);

        expect(model.getNumberOfTubes()).toEqual(2);
        expect(model.tubes[0].rawJson.tube.uuid).not.toEqual(model.tubes[1].rawJson.tube.uuid);
      });

      it("adding new tube in different batch throws exception", function() {	
        var tube = helper.createTubeWithDifferentBatch(1);
        expect(function() { model.addTube(tube); }).toThrow();
      });

      it("removing last tube causes batch to be undefined", function() {
        var uuid = helper.getUuidFromTube(model.tubes[0]);
        model.removeTubeByUuid(uuid);
        expect(model.getNumberOfTubes()).toEqual(0);
        expect(model.batch).toBeUndefined();
      });
    });

    describe("model with 12 tubes", function() {
      var model;

      beforeEach(function() { 
        model = new SelectionPageModel(123456789);
        for(var i = 0; i < 12; i++) {
          var newTube = helper.createTubeWithOriginalBatch(i);
          model.addTube(newTube);
        }
      });

      it("contains 12 tubes", function() { 
        expect(model.getNumberOfTubes()).toEqual(12);
      });

      it("remove tubes removes tube order and leaves batch defined", function() {
        var uuid = helper.getUuidFromTube(model.tubes[5]);
        var originalBatch = model.batch;
        model.removeTubeByUuid(uuid);
        expect(model.getNumberOfTubes()).toEqual(11);
        for(var i = 0; i < 11; i++) {
          var tube = model.tubes[i];
          expect(tube).toBeDefined();
          expect(helper.getUuidFromTube(tube)).not.toEqual(uuid);	
        }

        expect(model.batch).toEqual(originalBatch);

      });

      it("attempting to remove an tube with no matching uuid leaves model unchanged", function() {
        var uuid = helper.createUuid(20);
        model.removeTubeByUuid(uuid);

        expect(model.getNumberOfTubes()).toEqual(12);
      });

      it("adding new tube in different batch throws exception", function() {
        var tube = helper.createTubeWithDifferentBatch(12);
        expect(function() { model.addTube(order); }).toThrow();
      });

      it("adding new tube in same batch throws exception", function() {
        var tube = helper.createTubeWithOriginalBatch(12);
        expect(function() { model.addTube(tube); }).toThrow();
      });

      it("can return uuid from tube index", function() {
        for(var i = 0; i < model.getNumberOfTubes(); i++) {
          var expectedUuid = helper.createUuid(i);
          expect(model.getTubeUuidFromTubeIndex(i)).toBe(expectedUuid);
        }
      });
    })});

});
