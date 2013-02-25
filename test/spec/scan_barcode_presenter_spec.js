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
	
	view.generateTree = function(data) { 
	};

	view.attach = function() {
	};
	
	spyOn(view, 'clear');
	spyOn(view, 'generateTree');        
	spyOn(view, 'attach');
      }
      
      function configureSpyAppController() {
	app = {};
	app.childDone = function(presenter, action, data) {};

	spyOn(app, 'childDone');
	}


      beforeEach(function() {
	configureSpyView();
	configureSpyAppController();

	presenter = new ScanBarcodePresenter(app);
	presenter.setModel("tube");
	presenter.view = view;
	});

      it("presenter render calls generateTree and attach", function() {
	presenter.render();
	expect(view.clear).not.toHaveBeenCalled();
	expect(view.generateTree).toHaveBeenCalledWith(presenter.model);
	expect(view.attach).toHaveBeenCalled();
	});

      it("presenter release calls clear", function() {
	presenter.release();
	expect(view.clear).toHaveBeenCalled();
	expect(view.generateTree).not.toHaveBeenCalled();		       
	expect(view.attach).not.toHaveBeenCalled();
      });

      it("invalid barcode scan rerenders view", function() {
	presenter.childDone(presenter, "barcodeScanned", "asdf");
	expect(view.clear).not.toHaveBeenCalled();
	expect(view.generateTree).toHaveBeenCalled();
	expect(view.attach).toHaveBeenCalled();
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
