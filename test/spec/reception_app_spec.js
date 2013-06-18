define([
  'config'
  , 'lib/fake_user'
  , 'text!pipeline_testjson/reception_app_test_data.json'
  , 'mapper_test/resource_test_helper'
  , 'presenters/reception_presenter'
  , 'text!mapper_testjson/unit/root.json'
  , 'mapper/s2_root'
  , 'text!pipeline_testcsv/manifest_csv_test_data.csv'
  , 'presenters/presenter_factory'
  , 'extraction_pipeline/lib/reception_templates'
  , 'text!pipeline_testjson/csv_template_test_data.json'
  , 'text!pipeline_testjson/csv_template_display_test_data.json'
]
  , function (config, FakeUser, appTestData, TestHelper, ReceptionPresenter, rootTestData, S2Root, manifestCSVData, PresenterFactory, ReceptionTemplates, CSVTemplateTestData, CSVTemplateDisplayTestData) {
    'use strict';


    TestHelper(function (results) {
      describe("The Reception App", function () {

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

          // Injecting test template.
          ReceptionTemplates.templateList.push({ template_name: "test_template", friendly_name: "test_template" });
          ReceptionTemplates["test_template"] = {
            friendly_name: "test_template",
            model:         "tube",
            sample_type:   "RNA",
            aliquot_type:  "NA",
            json_template: JSON.parse(CSVTemplateTestData),
            json_template_display: JSON.parse(CSVTemplateDisplayTestData),
            header_line_number: 8,
            manifest_path:"../test/json/manifest_test_data.xls"
          };

          var pf = new PresenterFactory();
          var presenterConfig = {};
          presenter = pf.create('reception_presenter', app, presenterConfig);
          fakeContent().append(presenter.view);
        });

        afterEach(function(){
          delete ReceptionTemplates["test_template"];
          ReceptionTemplates.templateList.pop();
        });

        it('gives the user the option to create or load a manifest', function () {
          expect(fakeContent().find('#create-manifest-btn').length).toEqual(1);
          expect(fakeContent().find('#read-manifest-btn').length).toEqual(1);
        });

        describe("where a manifest csv is loaded", function () {
          beforeEach(function () {
            runs(function () {
              results.resetFinishedFlag();
              fakeContent()
                .find("#read-manifest-btn")
                .trigger('click');

              //wait for jquery animation
              waits(200);

              //simulate file input
              presenter.manifestReaderComponent.presenter.responderCallback(manifestCSVData)
                .then(function () {
                  FakeUser.waitsForIt(fakeDOM, "#registrationBtn", results.expected);
                })
                .fail(results.unexpected);
            });
            waitsFor(results.hasFinished);
          });

          it("makes the correct call when 'register' is clicked with one update selected", function () {
            var expectedData;
            runs(function () {
              expectedData = {
                type:     'POST',
                url:      '/actions/bulk_update_sample',
                dataType: 'json',
                headers:  { 'Content-Type': 'application/json' },
                data:     '{"bulk_update_sample":{"user":"username","by":"sanger_sample_id","updates":{"S2-13a8da96d0e34db1ac7d7c40159a2095":{"volume":2,"cellular_material":{"lysed":true},"state":"published"}}}}'
              };

              results.resetFinishedFlag();
              fakeContent()
                .find('.barcodeInput')
                .val("2881460250710")
                .trigger(FakeUser.aPressReturnEvent());

              waits(100);

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

          it("makes the correct call when 'register' is clicked with two updates selected", function () {
            var expectedData;
            runs(function () {
              expectedData = {
                type:     'POST',
                url:      '/actions/bulk_update_sample',
                dataType: 'json',
                headers:  { 'Content-Type': 'application/json' },
                data:     '{"bulk_update_sample":{"user":"username","by":"sanger_sample_id","updates":{"S2-13a8da96d0e34db1ac7d7c40159a2095":{"volume":2,"cellular_material":{"lysed":true},"state":"published"},"S2-cb4ee4768f334c38960ac89ec2074eb1":{"volume":2,"cellular_material":{"lysed":true},"state":"published"}}}}'
              };

              results.resetFinishedFlag();
              fakeContent()
                .find('.barcodeInput')
                .val("2881460250710")
                .trigger(FakeUser.aPressReturnEvent());

              waits(100);

              results.resetFinishedFlag();
              fakeContent()
                .find('.barcodeInput')
                .val("2886789170794")
                .trigger(FakeUser.aPressReturnEvent());

              waits(100);

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

          describe("and a barcode which cannot be found is entered", function () {
            beforeEach(function () {
              runs(function () {
                fakeContent()
                  .find("input.barcodeInput")
                  .val("1234567890123")
                  .trigger(FakeUser.aPressReturnEvent());
              });
              waitsFor(function () {
                return fakeContent().find("input.barcodeInput").val() == "";
              });
            });

            it("clears the input box", function () {
              runs(function () {
                expect(fakeContent().find("input.barcodeInput").val()).toEqual("");
              });
            });

            it("displays an error message to the user", function () {
              runs(function () {
                expect(fakeContent().find("div.validationText.alert.alert-error").length).toBeGreaterThan(0);
              });
            });
          });

          describe("and a barcode of less than 13 characters is entered", function () {
            beforeEach(function () {
              runs(function () {
                fakeContent()
                  .find("input.barcodeInput")
                  .val("12345")
                  .trigger(FakeUser.aPressReturnEvent());
              });
              waitsFor(function () {
                return fakeContent().find("input.barcodeInput").val() == "";
              });
            });

            it("clears the input box", function () {
              runs(function () {
                expect(fakeContent().find("input.barcodeInput").val()).toEqual("");
              });
            });

            it("displays a barcode error message to the user", function () {
              runs(function () {
                expect(fakeContent().find("div.validationText.alert.alert-error").length).toBeGreaterThan(0);
              });
            });
          });

          describe("and a valid barcode is entered", function () {
            beforeEach(function () {
              runs(function () {
                results.resetFinishedFlag();
                fakeContent()
                  .find('input.barcodeInput')
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

            it("the checkbox is enabled on the highlighed row", function () {
              runs(function () {
                expect(fakeContent().find('tbody tr.selectedRow td:first input').attr("checked")).toEqual("checked");
              });
            });

            it("the other checkbox is disabled", function () {
              runs(function () {
                expect(fakeContent().find('tbody tr.disabledRow td:first input').attr("disabled")).toEqual("disabled");
              });
            });

            it("after the checkbox is un-checked, the row it belongs to is disabled", function () {
              runs(function () {
                results.resetFinishedFlag();
                fakeContent()
                  .find('tbody tr.selectedRow td:first input')
                  .trigger('click');
              });
              waits(500);

              runs(function () {
                expect(fakeContent().find('tbody tr.disabledRow').length).toEqual(2);
              });
            });
          });
        });

        describe("on the 'Create a manifest' page", function () {
          beforeEach(function () {
            runs(function () {
              fakeContent()
                .find("#create-manifest-btn")
                .trigger("click");

              //wait for animation
              waits(200);
            });
          });

          it("shows an error if a string is entered for the number of tubes", function () {
            runs(function () {
              fakeContent()
                .find('#number-of-sample')
                .val("Computer, give me three tubes please")
                .trigger(FakeUser.aPressReturnEvent());

              waitsFor(function () {
                return fakeContent().find(".validationText.alert.alert-error").length > 0;
              });
              expect(fakeContent().find(".validationText.alert.alert-error").length).toBeGreaterThan(0);
            });
          });

          it("shows an error when given a string that starts with a number", function () {
            runs(function () {
              fakeContent()
                .find('#number-of-sample')
                .val("3 tubes please, computer!")
                .trigger(FakeUser.aPressReturnEvent());

              waitsFor(function () {
                return fakeContent().find(".validationText.alert.alert-error").length > 0;
              });
              expect(fakeContent().find(".validationText.alert.alert-error").length).toBeGreaterThan(0);
            });
          });

          describe("and there is a request to create a manifest with 3 tubes", function () {
            it("makes an appropriate ajax call", function () {
              var expectedData;
              runs(function () {
                spyOn(config, 'ajax').andCallThrough();
                expectedData = {
                  type:     'POST',
                  url:      '/actions/bulk_create_sample',
                  dataType: 'json',
                  headers:  { 'Content-Type': 'application/json' },
                  data:     '{"bulk_create_sample":{"user":"username","state":"draft","quantity":3,"sample_type":"DNA Human","sanger_sample_id_core":"QC1Hip"}}'
                };

                fakeContent()
                  .find('#number-of-sample')
                  .val(3)
                  .trigger(FakeUser.aPressReturnEvent());

                results.resetFinishedFlag();
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
  });
