define([
  'config'
  , 'lib/fake_user'
  , 'text!pipeline_testjson/reception_app_test_data.json'
  , 'mapper_test/resource_test_helper'
  , 'presenters/reception_presenter'
  , 'text!mapper_testjson/unit/root.json'
  , 'mapper/s2_root'
  , 'text!pipeline_testcsv/manifest_csv_test_data.csv'
]
  , function (config, FakeUser, appTestData, TestHelper, ReceptionPresenter, rootTestData, S2Root, manifestCSVData) {
    'use strict';


    TestHelper(function (results) {
      describe("Reception presenter", function () {

        var presenter, fakeDOM, fakeContent;
        beforeEach(function () {

          config.loadTestData(appTestData);
          config.cummulativeLoadingTestDataInFirstStage(rootTestData);
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

        describe("and a manifest csv is loaded and registered", function () {
          var expectedData;
          it("makes the correct call", function () {
            //trigger the file input directly with a string, can't do this from view
            runs(function () {
              // TODO: the expected data will need updating here
              expectedData = [
                [
                  [
                    {
                      type:     'GET',
                      url:      '/',
                      dataType: 'json',
                      data:     null
                    }
                  ],
                  [
                    {
                      type:     'POST',
                      url:      '/actions/bulk_update_sample',
                      dataType: 'json',
                      headers:  { "Content-Type": 'application/json' },
                      data:     '{"bulk_update_sample":{"user":"username","by":"sanger_sample_id","updates":{"S2-13a8da96d0e34db1ac7d7c40159a2095":{"volume":2,"cellular_material":{"lysed":true}},"S2-cb4ee4768f334c38960ac89ec2074eb1":{"volume":2,"cellular_material":{"lysed":true}}}}}'
                    }
                  ]
                ]
              ];

              spyOn(config, "ajax").andCallThrough();
              presenter.responderCallback(manifestCSVData)
                .then(function () {
                  FakeUser.waitsForIt(fakeDOM, "#registrationBtn", results.expected);
                })
                .fail(results.unexpected);
            });

            waitsFor(results.hasFinished);

            runs(function () {
              results.resetFinishedFlag();
              fakeContent()
                .find('#registrationBtn')
                .trigger('click');
            });

            waits(500);

            runs(function () {
              expect(config.ajax).toHaveBeenCalledWith(_.flatten(expectedData));
            });
          });
        });

        xdescribe("and the user attempts to enter 1 sample", function () {
          beforeEach(function () {
            runs(function () {
              fakeContent()
                .find('#number-of-sample')
                .val(1)
                .trigger(FakeUser.aPressReturnEvent());

              results.resetFinishedFlag();
              FakeUser.waitsForIt(fakeDOM,
                "#downloadManifest",
                results.expected
              );
            });
            waitsFor(results.hasFinished);
          });

          it("shows an error message to the user", function () {
            runs(function () {
              expect(fakeContent().find(".validationText.alert.alert-error").length).toEqual(1);
            });
          });
        });

        describe("and there is input request for 3 tubes", function () {
          it("makes an appropriate ajax call", function(){
            runs(function () {
              spyOn(config, 'ajax').andCallThrough();
              fakeContent()
                .find('#number-of-sample')
                .val(3)
                .trigger(FakeUser.aPressReturnEvent());

              results.resetFinishedFlag();
//              FakeUser.waitsForIt(fakeDOM,
//                "#downloadManifest",
//                results.expected
//              );
            });
            waits(500);

            runs(function(){
              expect(config.ajax).toHaveBeenCalled();
              expect(config.ajax).toHaveBeenCalledWith('derp');
            });
          });
        });
      });
    });
  });
