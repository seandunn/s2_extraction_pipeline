define(['models/selection_page_model', 'presenters/selection_page_presenter', 'spec/selection_page_helper'], function(SelectionPageModel, SelectionPagePresenter, SelectionPageHelper) {
  'use strict';

  describe("SelectionPagePresenter", function() {

    var helper = new SelectionPageHelper();
    var model = undefined;
    var presenter = undefined;
    var view = undefined;
    var app = undefined;
    var partialFactory = undefined;
    var mockPresenters = undefined;

    function configureSpyView() {
      view = {};
      
      view.clear = function() {
      };
      
      view.render = function(data) { 		      
      };

      view.getRowByIndex = function(index) {
	return "row_" + index;
      };
      
      spyOn(view, 'clear');
      spyOn(view, 'render');        
    }
    
    function configureSpyAppController() {
      app = {};
      app.childDone = function(presenter, action, data) {};
      
      spyOn(app, 'childDone');
    }

    function createMockPresenter(name) {
      var mockPresenter = { name : name};
      mockPresenter.setModel = function(model) {};
      mockPresenter.render = function() {};
      mockPresenter.release = function() {};
      mockPresenter.childDone = function(presenter, action, data) {};
      mockPresenter.setupView = function(selection) {};

      spyOn(mockPresenter, 'setModel');
      spyOn(mockPresenter, 'render');
      spyOn(mockPresenter, 'release');
      spyOn(mockPresenter, 'childDone');
      spyOn(mockPresenter, 'setupView');

      mockPresenters.push(mockPresenter);
      return mockPresenter;
      }

    function configureMockPartialFactory() {
      partialFactory = {};
      partialFactory.createPresenter = function(name, owner, model) {
	var mockPresenter = createMockPresenter(name);
	mockPresenter.setModel(model);
	return mockPresenter;
	}
      partialFactory.createScanBarcodePresenter = function(owner, model) {
	return this.createPresenter("scanBarcode", owner, model);
      }
      partialFactory.createTubeRemovalPresenter = function(owner, model) {
	return this.createPresenter("tubeRemoval", owner, model);
      }
    }

    function expectPartial(partial, typeName, args) {
      expect(partial).toBeDefined();
      expect(partial.name).toEqual(typeName);
      expect(partial.setupView).toHaveBeenCalled(); 
      if(args) {
	expect(partial.setModel).toHaveBeenCalledWith(args);
      }
      expect(partial.render).toHaveBeenCalled();
      
    };
    
    describe("presenter which has never been updated", function() {

      beforeEach(function() {
	mockPresenters = [];

	configureSpyView();
	configureSpyAppController();
	configureMockPartialFactory();

	model = new SelectionPageModel(123456789);
	model.addTube(helper.createTubeWithOriginalBatch(0));
	
	presenter = new SelectionPagePresenter(app, partialFactory);
	presenter.view = view;
	
      });

      it("updating presenter with empty model creates a ScanBarcodePresenter", function() {
	expect(mockPresenters.length).toBe(0);
	runs(function() { 
	  presenter.setModel(model);
	  presenter.render();
	});
	waitsFor(function() { 
	  return mockPresenters.length >= 2; 
	},
		 "child presenters were never created",
		 100);
	runs(function() {	  
	  expect(view.clear).toHaveBeenCalled();
	  expect(view.render).toHaveBeenCalled();
	  expect(mockPresenters.length).toBe(2);
	  expectPartial(mockPresenters[0], "tubeRemoval", null);
	  expectPartial(mockPresenters[1], "scanBarcode", "tube");
	  });
      });

      it("presenter release calls clear", function() {
	presenter.release();
	expect(view.clear).toHaveBeenCalled();
	expect(view.render).not.toHaveBeenCalled();		       
      });

      it("childDone on next command delegates to app controller", function() {
	presenter.childDone(presenter, "next", undefined);
	expect(app.childDone).toHaveBeenCalledWith(presenter, "done", undefined);
	});

      it("removeTube message with uuid not matching any tube does nothing", function() {
	runs(function() {
	  presenter.setModel(model);
	  presenter.render();
	  });
	waitsFor(function() {
	  return mockPresenters.length == 2;
	  },
		 "2 child presenters to be created",
		 100);
	runs(function() { 
	  presenter.childDone(presenter, "removeTube", { tube : { uuid: "1" } });
	  expect(mockPresenters[0].release).toHaveBeenCalled();
	  expect(mockPresenters[1].release).toHaveBeenCalled();
	});
      });

      it("removeTube message with uuid matching tube removes tube by uuid", function() {
	runs(function() {
	  presenter.setModel(model);
	  presenter.render();
	  });
	waitsFor(function() {
	  return mockPresenters.length == 2;
	},
		 "2 child presenters to be created",
		 100);
	runs(function() { 
	  console.log("calling child done");
	  presenter.childDone(this, "removeTube", { tube : { uuid: "11111111-2222-3333-4444-555555555555" } });
	  });
	waitsFor(function() {
	    return mockPresenters[0].release.wasCalled;
	},
		 "release to have been called",
		 100);
	runs(function() {
	  expect(mockPresenters[0].release).toHaveBeenCalled();
	  expect(mockPresenters[1].release).toHaveBeenCalled();
	});
	
      });
    });
  });
});
