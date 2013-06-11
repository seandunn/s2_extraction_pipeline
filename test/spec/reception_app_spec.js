define([
  'config'
  , 'lib/fake_user'
  , 'text!pipeline_testjson/reception_app_test_data.json'
  , 'mapper_test/resource_test_helper'
  , 'presenters/reception_presenter'
  , 'text!mapper_testjson/unit/root.json'
  , 'mapper/s2_root'
  , 'text!pipeline_testcsv/manifest_csv_test_data.csv'
  , 'presenters/presenter_factory']
  , function (config, FakeUser, appTestData, TestHelper, ReceptionPresenter, rootTestData, S2Root, manifestCSVData, PresenterFactory) {
    'use strict';


    TestHelper(function (results) {
      describe("Reception presenter", function () {

        var presenter, fakeDOM, fakeContent;
        beforeEach(function () {
          config.loadTestData(appTestData);
          config.cummulativeLoadingTestDataInFirstStage(rootTestData);
          var app;
          fakeDOM = $('<div><div id="content"></div></div>');
          fakeContent = function () {
            return fakeDOM.find("#content");
          };
          app = {
            getS2Root: function () {
              if (this.rootPromise === undefined) {
                this.rootPromise = S2Root.load({user: "username"});
              }
              return this.rootPromise;
            }
          };
          var pf = new PresenterFactory();
          var presenterConfig = {};
          presenter = pf.create('reception_presenter', app, presenterConfig);
          fakeContent().append(presenter.view);
        });

        it('gives the user the option to create or load a manifest', function () {
          expect(fakeContent().find('#create-manifest-btn').length).toEqual(1);
          expect(fakeContent().find('#read-manifest-btn').length).toEqual(1);
        });

        describe("and a manifest csv is loaded", function () {
          beforeEach(function(){
            runs(function () {
              results.resetFinishedFlag();
              fakeContent()
                .find("#read-manifest-btn")
                .trigger('click');

              //wait for jquery animation
              waits(500);

              //simulate file input
              presenter.manifestReaderComponent.presenter.responderCallback(manifestCSVData)
                .then(function () {
                  FakeUser.waitsForIt(fakeDOM, "#registrationBtn", results.expected);
                })
                .fail(results.unexpected);
            });
            waitsFor(results.hasFinished);
          });

          describe("and a valid barcode is entered", function(){
            beforeEach(function(){
              runs(function () {
                results.resetFinishedFlag();
                fakeContent()
                  .find('.barcodeInput')
                  .val("2881460250710")
                  .trigger(FakeUser.aPressReturnEvent());

                FakeUser.waitsForIt(fakeContent(),
                  "tbody tr.selectedRow",
                  results.expected
                );
              });
              waitsFor(results.hasFinished);
            });

            it("highlights the row", function () {
              runs(function () {
                expect(fakeContent().find('tbody tr.selectedRow').length).toEqual(1);
              });
            });

            it("removes the barcode from the input", function () {
              runs(function () {
                expect(fakeContent().find('.barcodeInput').val()).toEqual('')
              });
            });

            it("the checkbox is enabled on the highlighed row", function(){
              runs(function(){
                expect(fakeContent().find('tbody tr.selectedRow td:first input').attr("checked")).toEqual("checked");
              });
            });

            it("the other checkbox is disabled", function(){
              runs(function(){
                expect(fakeContent().find('tbody tr.disabledRow td:first input').attr("disabled")).toEqual("disabled");
              });
            });

            it("after the checkbox is un-checked, the row it belongs to is disabled", function(){
              runs(function(){
                results.resetFinishedFlag();
                fakeContent()
                  .find('tbody tr.selectedRow td:first input')
                  .trigger('click');

//                FakeUser.waitsForIt(
//                  "tbody tr:first .disabledRow",
//                  results.expected
//                );
              });
//              waitsFor(results.hasFinished);

              waits(500);

              runs(function(){
                expect(fakeContent().find('tbody tr.disabledRow').length).toEqual(2);
              });
            });
          });

          it("makes the correct call when 'register' is clicked", function () {
            var expectedData;
            runs(function () {
              expectedData = {
                type:     'POST',
                url:      '/actions/bulk_update_sample',
                dataType: 'json',
                headers:  { 'Content-Type': 'application/json' },
                data:     '{"bulk_update_sample":{"user":"username","by":"sanger_sample_id","updates":{"S2-13a8da96d0e34db1ac7d7c40159a2095":{"volume":2,"cellular_material":{"lysed":true}},"S2-cb4ee4768f334c38960ac89ec2074eb1":{"volume":2,"cellular_material":{"lysed":true}}}}}'
              };

              spyOn(config, "ajax").andCallThrough();

              results.resetFinishedFlag();
              fakeContent()
                .find('#registrationBtn')
                .trigger('click');
            });

            waits(500);

            runs(function () {
              expect(config.ajax).toHaveBeenCalledWith(expectedData);
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
          it("makes an appropriate ajax call", function () {
            var expectedData;
            runs(function () {
              spyOn(config, 'ajax').andCallThrough();
              expectedData = {
                type:     'POST',
                url:      '/actions/bulk_create_sample',
                dataType: 'json',
                headers:  { 'Content-Type': 'application/json' },
                data:     '{"bulk_create_sample":{"user":"username","state":"draft","quantity":3,"sample_type":"RNA","sanger_sample_id_core":"QC1Hip"}}'
              };

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

            runs(function () {
              expect(config.ajax).toHaveBeenCalledWith(expectedData);
            });
          });
        });
      });
    });
  });
