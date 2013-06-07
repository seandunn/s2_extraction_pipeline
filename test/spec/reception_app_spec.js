define([
  'config'
  , 'lib/fake_user'
  , 'text!pipeline_testjson/reception_app_test_data.json'
  , 'mapper_test/resource_test_helper'
  , 'presenters/reception_presenter'
  , 'mapper/s2_root'
]
  , function (config, FakeUser, appTestData, TestHelper, ReceptionPresenter, S2Root) {
    'use strict';


    TestHelper(function (results) {
      describe("Reception presenter", function () {

        var presenter, fakeDOM, fakeContent;
        beforeEach(function () {

          config.loadTestData(appTestData);
          var app;
          fakeDOM = $('<div><div id="content"/></div>');
          fakeContent = function () {
            return fakeDOM.find("#content");
          };

          app = {
            getS2Root: function () {
              if (this.rootPromise === undefined) {
                // User should be passed in here not hard-coded
                this.rootPromise = S2Root.load({user: "username"});
              }
              return this.rootPromise;
            }
          };

          var presenterConfig = {};
          presenter = Object.create(ReceptionPresenter).init(app, config);
          fakeContent().append(presenter.view);
        });


        it('gives the user the option to create or load a manifest', function () {
          var headers = fakeContent().find('h4');

          expect(_.find(headers, function (header) {
            return header.innerHTML === "Create a new manifest";
          })).toBeTruthy();

          expect(_.find(headers, function (header) {
            return header.innerHTML === "Load a manifest";
          })).toBeTruthy();

        });

        describe("and the user attempts to enter 1 sample", function () {
          beforeEach(function () {
            runs(function () {
              fakeContent()
                .find('#number-of-sample')
                .val(1)
                .trigger(FakeUser.aPressReturnEvent());

              results.resetFinishedFlag();
              FakeUser.waitsForIt(fakeDOM,
                "#downloadManifest",
                results.expected(),
                results.unexpected()
              )
            });
            waitsFor(results.hasFinished);
          });

          it("shows an error message to the user", function(){
            runs(function(){
              expect(fakeContent().find(".validationText.alert.alert-error").length).toEqual(1);
            });
          });
        });

        describe("and there is input request for 3 tubes", function () {
          beforeEach(function () {
            runs(function () {
              fakeContent()
                .find('#number-of-sample')
                .val(2)
                .trigger(FakeUser.aPressReturnEvent());

              results.resetFinishedFlag();
              FakeUser.waitsForIt(fakeDOM,
                "#downloadManifest",
                results.expected(),
                results.unexpected()
              )
            });
            waitsFor(results.hasFinished);
          });
        });
      });
    });
  });
