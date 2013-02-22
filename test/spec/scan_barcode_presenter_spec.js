define(['scripts/presenters/scan_barcode_presenter'], function(ScanBarcodePresenter) {
  'use strict';
  
  describe("ScanBarcodePresenter", function() {
    describe("default presenter", function()  {
      
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

	presenter = new ScanBarcodePresenter(app, "tube");
	presenter.view = view;
	});

      it("presenter update calls clear then render", function() {
	presenter.update();
	expect(view.clear).toHaveBeenCalled();
	expect(view.render).toHaveBeenCalledWith(presenter.model);
	});


      it("presenter release calls clear", function() {
	presenter.release();
	expect(view.clear).toHaveBeenCalled();
	expect(view.render).not.toHaveBeenCalled();		       
      });

      it("invalid barcode scan rerenders view", function() {
	presenter.childDone(presenter, "barcodeScanned", "asdf");
	expect(view.clear).toHaveBeenCalled();
	expect(view.render).toHaveBeenCalled();
      });

      it("valid barcode sent to owner", function() {
	presenter.model.getResourceFromBarcode = function() {
	  console.log("getRFB");
	  return {
	    done : function(callback) {
	      console.log("done");
	      callback();
	      return this;
	      },
	    fail : function(callback) {
	      console.log("fail");
	      callback();
	      }
	    };
	}


	presenter.childDone(presenter, "barcodeScanned", "tube0001");
	expect(app.childDone).toHaveBeenCalledWith(presenter, "barcodeScanned", undefined);
      });
    });
  });
});
