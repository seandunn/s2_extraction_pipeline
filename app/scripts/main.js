require.config({
  shim: {
  },

  paths: {
    hm: 'vendor/hm',
    esprima: 'vendor/esprima',
    jquery: 'vendor/jquery.min',
  }
});
 
require(['app', 'presenters/selection_page_presenter', 'models/selection_page_model','presenters/partial_presenter_factory'], function(app, SelectionPagePresenter, SelectionPageModel, PartialPresenterFactory) {
  // use app here
  function stubSelectionPage() {

    var controller = { 
      childDone: function(presenter, action, data) {
	if(action === "next") {
	  presenter.release();
	}
      }
    }

    var factory = new PartialPresenterFactory();
    var presenter = new SelectionPagePresenter(controller, factory);
    var model = new SelectionPageModel("123456789");
    presenter.init($('body'));
    presenter.update(model); 
    }

  console.log(app);
  stubSelectionPage();
  
});
