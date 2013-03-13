define(['scripts/default/default_presenter'], function (DefaultPresenter) {
  'use strict';

  describe("DefaultPresenter", function () {

    describe("default initialisation", function () {

      var presenterFactory = {};
      var model = undefined;
      var defaultPresenter = undefined;
      var view = undefined;
      var owner = {};
      var jquerySelection = function () {
        return $('');
      };

      function configureSpies() {
        view = {};
        view.clear = function () {
        };
        view.render = function (data) {
        };
        spyOn(view, 'clear');
        spyOn(view, 'render');

        presenterFactory = {};
        presenterFactory.createDefaultPresenter = function () {
        };

        spyOn(presenterFactory, 'createDefaultPresenter');
      }

      it("default presenter is setup properly", function () {
        configureSpies();
        defaultPresenter = new DefaultPresenter(owner, presenterFactory);
        defaultPresenter.updateModel = function () {
        };
        spyOn(defaultPresenter, 'updateModel');

        defaultPresenter.setupPresenter({}, jquerySelection);

        expect(defaultPresenter.currentView).toBeDefined();
        expect(defaultPresenter.presenterFactory).toBeDefined();
        expect(defaultPresenter.owner).toBeDefined();
        expect(defaultPresenter.updateModel).toHaveBeenCalled();

      });




//      beforeEach(function () {
//        configureSpyView();
//
//        presenter = new DefaultPresenter(app);
//        presenter.setupPresenter(undefined,undefined);
//        presenter.view = view;
//      });
//
//      it("presenter render calls view render", function () {
//        presenter.render();
//        expect(view.clear).not.toHaveBeenCalled();
//        expect(view.render).toHaveBeenCalledWith(presenter.model);
//      });
//
//      it("presenter release calls clear", function () {
//        presenter.release();
//        expect(view.clear).toHaveBeenCalled();
//        expect(view.render).not.toHaveBeenCalled();
//      });
//
//      it("invalid barcode scan rerenders view", function () {
//        presenter.childDone(presenter, "barcodeScanned", "asdf");
//        expect(view.clear).not.toHaveBeenCalled();
//        expect(view.render).toHaveBeenCalled();
//      });
//
//      it("valid barcode sent to owner", function () {
//        presenter.model.getResourceFromBarcode = function () {
//          console.log("getRFB");
//          return {
//            done:function (callback) {
//              console.log("done");
//              callback();
//              return this;
//            },
//            fail:function (callback) {
//              console.log("fail");
//              callback();
//            }
//          };
//        }
//
//
//        presenter.childDone(presenter, "barcodeScanned", "tube0001");
//        expect(app.childDone).toHaveBeenCalledWith(presenter, "barcodeScanned", undefined);
//      });
    });
  });
});
