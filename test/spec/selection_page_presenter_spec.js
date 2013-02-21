define(['scripts/models/selection_page_model', 'scripts/presenters/selection_page_presenter', 'spec/selection_page_helper'], function(SelectionPageModel, SelectionPagePresenter, SelectionPageHelper) {
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
      mockPresenter.init = function(selection) {};
      mockPresenter.update = function(model) {};
      mockPresenter.release = function(model) {};
      mockPresenter.childDone = function(presenter, action, data) {};

      spyOn(mockPresenter, 'init');
      spyOn(mockPresenter, 'update');
      spyOn(mockPresenter, 'release');
      spyOn(mockPresenter, 'childDone');

      mockPresenters.push(mockPresenter);
      return mockPresenter;
      }

    function configureMockPartialFactory() {
      partialFactory = {};
      partialFactory.createScanBarcodePresenter = function(owner, selection) {
	return createMockPresenter("scanBarcode");
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
	presenter.update(model);
	expect(view.clear).toHaveBeenCalled();
	expect(view.render).toHaveBeenCalledWith(model);
      });

      it("updating presenter with empty model creates a ScanBarcodePresenter", function() {
	presenter.update(model);
	expect(mockPresenters.length).toEqual(1);
	var firstPartial = mockPresenters[0];
	expect(firstPartial).toBeDefined();
	expect(firstPartial.name).toEqual("scanBarcode");
	expect(firstPartial.init).toHaveBeenCalledWith("row_1"); // TODO : make this called with
	expect(firstPartial.update).toHaveBeenCalledWith("");
	});

      it("presenter release calls clear", function() {
	presenter.release();
	expect(view.clear).toHaveBeenCalled();
	expect(view.render).not.toHaveBeenCalled();		       
      });

      it("childDone on next command delegates to app controller", function() {
	presenter.childDone(presenter, "next", undefined);
	expect(app.childDone).toHaveBeenCalledWith(presenter, "next", undefined);
	});
    });

  });
});
