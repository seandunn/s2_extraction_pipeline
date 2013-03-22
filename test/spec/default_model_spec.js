define(['scripts/default/default_model'
  , 'config'
  , 'mapper/s2_root'
  , 'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction/1.json'
], function (DefaultModel, config, S2Root, dataJSON) {
  'use strict';

  describe("DefaultModel", function () {


    describe("default initialisation", function () {

      var defaultModel = Object.create(DefaultModel);

      it("model can be instanciated", function () {
        expect(defaultModel).toBeDefined();
      });

    });


    describe("default initialisation", function () {

      var defaultModel = undefined;
      var owner = undefined;

      var getS2RootFunc = function (that) {
            var deferredS2Root = new $.Deferred();
            if (!that.s2Root) {
              config.setupTest(dataJSON); // TODO: remove this line to activate the real mapper
              S2Root.load({user:"username"}).done(function (result) {
                console.log("loaded");
                that.s2Root = result;
                deferredS2Root.resolve(result);
              }).fail(function () {
                  deferredS2Root.reject();
                });
            } else {
              deferredS2Root.resolve(that.s2Root);
            }
            return deferredS2Root.promise();
        };


//      beforeEach(function(){
//        defaultModel = Object.create(DefaultModel);
//        owner = {};
//        owner.getS2Root = jasmine.createSpy('getS2Root').andReturn(getS2RootFunc(owner));
//        owner.childDone = function () {};
//        defaultModel.init(owner);
//        debugger;
//        spyOn(owner, 'childDone');
//      });

      it("found a tube from correct BC", function () {
        defaultModel = Object.create(DefaultModel);
        owner = {};
        owner.getS2Root = jasmine.createSpy('getS2Root').andReturn(getS2RootFunc(owner));
        owner.childDone = function () {
        };
        defaultModel.init(owner);
        spyOn(owner, 'childDone');
        defaultModel.fetchResourcePromiseFromBarcode("1220017279667").then(function () {
          expect(owner.getS2Root).toHaveBeenCalled();
          expect(Object.keys(defaultModel.stash_by_BC).length).toEqual(1);
        });
      });

      it("found a tube from correct BC", function () {
        defaultModel = Object.create(DefaultModel);
        owner = {};
        owner.getS2Root = jasmine.createSpy('getS2Root').andReturn(getS2RootFunc(owner));
        owner.childDone = function () {
        };
        defaultModel.init(owner);
        spyOn(owner, 'childDone');
        defaultModel.fetchResourcePromiseFromBarcode("1220017279667").then(function () {
          expect(owner.getS2Root).toHaveBeenCalled();
          expect(Object.keys(defaultModel.stash_by_BC).length).toEqual(1);
        });
      });

      it("found a tube from correct BC", function () {
        defaultModel = Object.create(DefaultModel);
        owner = {};
        owner.getS2Root = jasmine.createSpy('getS2Root').andReturn(getS2RootFunc(owner));
        owner.childDone = function () {
        };
        defaultModel.init(owner);
        spyOn(owner, 'childDone');
        defaultModel.fetchResourcePromiseFromBarcode("1220017279667").then(function () {
          expect(owner.getS2Root).toHaveBeenCalled();
          expect(Object.keys(defaultModel.stash_by_BC).length).toEqual(1);
        });
      })


//
//      var presenterFactory = {};
//      var model = undefined;
//      var defaultPresenter = undefined;
//      var view = undefined;
//      var owner = {};
//      var jquerySelection = function () {
//        return $('');
//      };
//
//      function configureSpies() {
//        view = {};
//        view.clear = function () {
//        };
//        view.render = function (data) {
//        };
//        spyOn(view, 'clear');
//        spyOn(view, 'render');
//
//        presenterFactory = {};
//        presenterFactory.createDefaultPresenter = function () {
//        };
//
//        spyOn(presenterFactory, 'createDefaultPresenter');
//      }
//
//      it("default presenter is setup properly", function () {
//        configureSpies();
//        defaultPresenter = new DefaultPresenter(owner, presenterFactory);
//        defaultPresenter.updateModel = function () {
//        };
//        spyOn(defaultPresenter, 'updateModel');
//
//        defaultPresenter.setupPresenter({}, jquerySelection);
//
//        expect(defaultPresenter.currentView).toBeDefined();
//        expect(defaultPresenter.presenterFactory).toBeDefined();
//        expect(defaultPresenter.owner).toBeDefined();
//        expect(defaultPresenter.updateModel).toHaveBeenCalled();
//
//      });
//


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
})
;
