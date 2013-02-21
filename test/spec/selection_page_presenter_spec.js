define(['scripts/models/selection_page_model', 'scripts/presenters/selection_page_presenter', 'spec/selection_page_helper'], function(SelectionPageModel, SelectionPagePresenter, SelectionPageHelper) {
  'use strict';

  describe("SelectionPagePresenter", function() {

    var helper = new SelectionPageHelper();

    describe("presenter which has never been updated", function() {

      var model = undefined;
      var presenter = undefined;
      var view = undefined;
      var app = undefined;

       function configureSpyView() {
	view = {};

	view.clear = function() {
	};

	view.render = function(data) { 		      
	};

	spyOn(view, 'clear');
	spyOn(view, 'render');        
       }

      function configureSpyAppController() {
	app = {};
	app.childDone = function(presenter, action, data) {};

	spyOn(app, 'childDone');
	}

      beforeEach(function() {

	configureSpyView();
	configureSpyAppController();

	model = new SelectionPageModel(123456789);
	model.addOrder(helper.createOrderWithOriginalBatch(0));

	presenter = new SelectionPagePresenter(app);
	presenter.view = view;
	
      });

      it("presenter update calls clear then render", function() {
	presenter.update(model);
	expect(view.clear).toHaveBeenCalled();
	expect(view.render).toHaveBeenCalledWith(model);
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
