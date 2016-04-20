//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  'config'
  , 'test/lib/fake_user'
  , 'text!pipeline_testjson/reception_app_test_data.json'
  , 'mapper_test/resource_test_helper'
  , 'controllers/reception_controller'
  , 'text!mapper_testjson/unit/root.json'
  , 'mapper/s2_root'
  , 'text!pipeline_testcsv/manifest_csv_test_data.csv'
  , 'controllers/controller_factory'
  , 'lib/reception_templates'
  , 'text!pipeline_testjson/csv_template_test_data.json'
  , 'text!pipeline_testjson/csv_template_display_test_data.json'
]
  , function (config, FakeUser, appTestData, TestHelper, ReceptionController, rootTestData, S2Root, manifestCSVData, ControllerFactory, ReceptionTemplates, CSVTemplateTestData, CSVTemplateDisplayTestData) {
    'use strict';


    TestHelper(function (results) {
      describe.skip("The Reception App", function () {

        var controller, fakeDOM, fakeContent;

        beforeEach(function () {
          
          this.clock = sinon.useFakeTimers();

          config.loadTestData(appTestData);
          config.cummulativeLoadingTestDataInFirstStage(rootTestData);
          
          var app = {
            getS2Root: function () {
              if (this.rootPromise === undefined) {
                this.rootPromise = S2Root.load({user: "username"});
              }
              return this.rootPromise;
            }
          };

          fakeDOM = $('<div><div id="content"></div></div>');
          
          fakeContent = function () {
            return fakeDOM.find("#content");
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

          var pf = new ControllerFactory();
          var controllerConfig = {};
          controller = pf.create('reception_controller', app, controllerConfig);
          fakeContent().append(controller.view);
          fakeContent()
            .find("#userValidation input")
            .val("1")
            .trigger(FakeUser.aPressReturnEvent());

          this.clock.tick(100);
        });

        afterEach(function(){
          this.clock.restore();
          
          delete ReceptionTemplates["test_template"];
          
          ReceptionTemplates.templateList.pop();
        });

        it('gives the user the option to create or load a manifest', function () {
          expect(fakeContent().find('#create-manifest-btn').length).to.equal(1);
          expect(fakeContent().find('#read-manifest-btn').length).to.equal(1);
        });

        describe("where a manifest csv is loaded", function () {

          beforeEach(function (done) {
            
            this.timeout(10000);

            this.clock = sinon.useFakeTimers();

            results.resetFinishedFlag();
            
            fakeContent()
              .find("#read-manifest-btn")
              .trigger('click');

            //wait for jquery animation
            this.clock.tick(500);

            //simulate file input
            controller.manifestReaderComponent.controller.responderCallback(manifestCSVData)
              .then(function () {
                FakeUser.waitsForIt(fakeDOM, "#registrationBtn", function() {
                  results.expected();
                  expect(results.hasFinished()).to.equal(true);
                });
              })
              .fail(function() { 
                results.unexpected(); 
              })
              .always(done)
          });

          afterEach(function() {
            this.clock.restore();
          })

          it("makes the correct call when 'register' is clicked with one update selected", function () {
            
            var expectedData = {
                type:     'POST',
                url:      '/actions/bulk_update_sample',
                dataType: 'json',
                headers:  { 'Content-Type': 'application/json' },
                data:     '{"bulk_update_sample":{"user":"username","by":"sanger_sample_id","updates":{"S2-13a8da96d0e34db1ac7d7c40159a2095":{"cellular_material":{"extraction_process":"DNA & RNA Manual","lysed":true,"donor_id":"JB121"},"volume":2,"state":"published"}}}}'
              };

              results.resetFinishedFlag();
              fakeContent()
                .find("tbody :nth-child(2) input")
                .trigger("click");

              waits(100);

              spyOn(config, "ajax").andCallThrough();

              results.resetFinishedFlag();
              fakeContent()
                .find('#registrationBtn')
                .trigger('click');
            

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
                data:     '{"bulk_update_sample":{"user":"username","by":"sanger_sample_id","updates":{"S2-13a8da96d0e34db1ac7d7c40159a2095":{"cellular_material":{"extraction_process":"DNA & RNA Manual","lysed":true,"donor_id":"JB121"},"volume":2,"state":"published"},"S2-cb4ee4768f334c38960ac89ec2074eb1":{"cellular_material":{"extraction_process":"DNA & RNA Manual","lysed":true,"donor_id":"SD232"},"volume":2,"state":"published"}}}}'
              };

              results.resetFinishedFlag();

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
                  data:     '{"bulk_create_sample":{"user":"username","state":"draft","quantity":3,"sample_type":"Cell Pellet","sanger_sample_id_core":"QC1Hip"}}'
                };

                // choose cell pellet from the list
                fakeContent()
                  .find(".samplePrefixes")
                  .val("Cell Pellet");

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
