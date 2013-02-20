require.config({
  shim: {
  },

  paths: {
    hm: 'vendor/hm',
    esprima: 'vendor/esprima',
    jquery: 'vendor/jquery.min',
  }
});
 
require(['app', 'presenters/selection_page_presenter', 'models/selection_page_model'], function(app, SelectionPagePresenter, SelectionPageModel) {
  // use app here
  function stubSelectionPage() {

    var controller = { 
      childDone: function(presenter, action, data) {
	if(action === "next") {
	  presenter.release();
	}
      }
    }

    var presenter = new SelectionPagePresenter(controller);
    var model = new SelectionPageModel("123456789");
    presenter.init($('body'));
    presenter.update(model); 
    }

  console.log(app);
  stubSelectionPage();
  
});
