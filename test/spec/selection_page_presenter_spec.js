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
      partialFactory.createScanBarcodePresenter = function(owner, model) {
	var mockPresenter = createMockPresenter("scanBarcode");
	mockPresenter.setModel(model);
	return mockPresenter;
      }
      }
    
    describe("presenter which has never been updated", function() {

      beforeEach(function() {
	mockPresenters = [];

	configureSpyView();
	configureSpyAppController();
	configureMockPartialFactory();

	model = new SelectionPageModel(123456789);
	model.addOrder(helper.createOrderWithOriginalBatch(0));
	
	presenter = new SelectionPagePresenter(app, partialFactory);
	presenter.view = view;
	
      });

      it("presenter update calls clear then render", function() {
	presenter.setModel(model);
	presenter.render();
	expect(view.clear).toHaveBeenCalled();
	expect(view.render).toHaveBeenCalled();
      });

      it("updating presenter with empty model creates a ScanBarcodePresenter", function() {
	presenter.setModel(model);
	presenter.render();
	expect(mockPresenters.length).toBe(1);
	var firstPartial = mockPresenters[0];
	expect(firstPartial).toBeDefined();
	expect(firstPartial.name).toEqual("scanBarcode");
	expect(firstPartial.setupView).toHaveBeenCalled(); 
	expect(firstPartial.setModel).toHaveBeenCalledWith("tube");
	expect(firstPartial.render).toHaveBeenCalled();
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
    });

  });
});
