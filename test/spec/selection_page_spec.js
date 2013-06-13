define([
  'config'
  , 'lib/fake_user'
  , 'mapper_test/resource_test_helper'
  , 'mapper/s2_root'
  , 'models/selection_page_model'
  , 'presenters/selection_page_presenter'
  , 'presenters/presenter_factory'
  , 'extraction_pipeline/lib/pubsub'
  , 'text!mapper_testjson/unit/root.json'
  , 'text!pipeline_testjson/selection_page_data.json'
], function (config, FakeUser, TestHelper, S2Root, SelectionPageModel,
             SelectionPagePresenter, PresenterFactory, PubSub,
             rootTestData, selectionPageData) {
  'use strict';


  TestHelper(function (results) {

    describe("Selection page presenter", function () {

      var s2Root, app, presenter, fakeContent, $fakeDOM;

      beforeEach(function () {
        app = {
          getS2Root: function () {
            var deferredS2Root = new $.Deferred();
            if (!s2Root) {
              S2Root.load({user: "username"}).done(function (result) {
                s2Root = result;
                deferredS2Root.resolve(result);
              }).fail(function () {
                  deferredS2Root.reject();
                });
            } else {
              deferredS2Root.resolve(s2Root);
            }
            return deferredS2Root.promise();
          },
          childDone: function () {
          }
        };

        var presenterName = "selection_page_presenter";

        $fakeDOM = $('<div><div id="content"/></div>');

        fakeContent = function () {
          return $fakeDOM.find("#content");
        };

        var initData = {
          "accepts":       [ "samples.extraction.manual.dna_and_rna.input_tube_nap" ],
          "presenterName": "selection_page_presenter",
          "processTitle":  "Manual DNA and RNA Extraction",
          "input":         {
            "role":  "samples.extraction.manual.dna_and_rna.input_tube_nap",
            "model": "tubes"
          },
          "output":        [
            {
              "role":        "samples.extraction.manual.dna_and_rna.binding_input_tube_nap",
              "aliquotType": "NA+P"
            }
          ]
        };
        var pf = new PresenterFactory();
        presenter = pf.create(presenterName, app, initData);
      });

      describe("which is given one tube", function () {

        beforeEach(function () {
          config.loadTestData(selectionPageData);
          config.cummulativeLoadingTestDataInFirstStage(rootTestData);

          var model;

          runs(function () {
            results.resetFinishedFlag();
            app.getS2Root().then(function (root) {
              return root.find("tube1UUID");
            }).then(function (initialLabware) {

                model = {
                  user:    "123456789",
                  labware: initialLabware
                }

              })
              .then(results.expected)
              .fail(results.unexpected)
          });

          waitsFor(results.hasFinished);

          runs(function () {
            results.resetFinishedFlag();
            presenter.setupPresenter(model, function () {
              return fakeContent();
            });
            results.expected();
          });

          waitsFor(results.hasFinished);

          PubSub.removeAll('s2.status.error');
        });

        it('displays a tube', function () {
          var $tube = fakeContent().find('ol li:first-child .resource');
          expect($tube.get(0).innerHTML).not.toEqual('');
          expect($tube.find('svg').length).toEqual(1);
        });

        it('does not show more than one tube', function () {
          var $resources = fakeContent().find('.resource');
          _.chain($resources)
            .drop(1)
            .each(function (resource) {
              var $resource = $(resource);
              expect($resource.get(0).innerHTML).toEqual('');
              expect($resource.find('svg').length).toEqual(0);
            });
        });

        it('the HTML has been changed from when it was initialised', function () {
          var $initialFakeDOM = $('<div><div id="content"/></div>');
          expect(fakeContent()).not.toEqual($initialFakeDOM);
        });

        it("sends an error message if the tube isn't found", function () {
          runs(function () {
            results.reset();

            PubSub.subscribe('s2.status.error', function (event, source, eventData) {
              results.assignTo('eventData')(eventData);
              results.expected();
            });

            fakeContent()
                .find('ol li:nth-child(2) input.barcodeInput')
                .val(1234567890123)
                .trigger(FakeUser.aPressReturnEvent());
          });

          waitsFor(results.hasFinished);

          runs(function () {
            expect(results.get('eventData').message).toEqual("Couldn't find the resource related to this barcode");
          });
        });

        it("sends an error message if the tube has already been entered", function () {
          runs(function () {
            results.reset();

            PubSub.subscribe('s2.status.error', function (event, source, eventData) {
              results.assignTo('eventData')(eventData);
              results.expected();
            });

            fakeContent()
                .find('ol li:nth-child(2) input.barcodeInput')
                .val(1220017279667)
                .trigger(FakeUser.aPressReturnEvent());

            waitsFor(results.hasFinished);

            runs(function () {
              expect(results.get('eventData').message).toEqual("You cannot add the same tube twice.");
            });
          });
        });

        it("sends an error message if the tube has the wrong aliquot", function () {
          runs(function () {
            results.reset();

            PubSub.subscribe('s2.status.error', function (event, source, eventData) {
              results.assignTo('eventData')(eventData);
              results.expected();
            });

            fakeContent()
                .find('ol li:nth-child(2) input.barcodeInput')
                .val(1220017279670)
                .trigger(FakeUser.aPressReturnEvent());

            waitsFor(results.hasFinished);

            runs(function () {
              expect(results.get('eventData').message).toEqual("You can only add 'NA+P' tubes into this batch. The scanned barcode corresponds to a 'DNA+P' tube.");
            });
          });
        });

        it("sends an error message if the tube has the wrong role", function () {
          runs(function () {
            results.reset();

            PubSub.subscribe('s2.status.error', function (event, source, eventData) {
              results.assignTo('eventData')(eventData);
              results.expected();
            });

            fakeContent()
                .find('ol li:nth-child(2) input.barcodeInput')
                .val(1220017279671)
                .trigger(FakeUser.aPressReturnEvent());

            waitsFor(results.hasFinished);

            runs(function () {
              expect(results.get('eventData').message).toEqual("This tube cannot be added to the current batch, because it does not have the correct role.");
            });
          });
        });

        it('has an ordered list with 12 list elements in the view', function () {
          var $selection = fakeContent();
          expect($selection.find('ol li').length).toEqual(12);
        });

        it('has the second item in the list as a barcode scanner', function () {
          var $secondItemInList = fakeContent().find('ol li:nth-child(2)');
          expect($secondItemInList.find('.barcodeScanner').length).toEqual(1);
          expect($secondItemInList.find('.resource svg').length).toEqual(0);
        });

        it('removes the tube when the its remove button is clicked', function () {
          var $removeBtn = fakeContent().find('ol li').first();

          expect($removeBtn.find('.resource').length).toEqual(1);
          $removeBtn.find('.removeButton').trigger('click');

          var $removeBtnPostClick = fakeContent().find('ol li').first();
          expect($removeBtnPostClick.find('.resource svg').length).toEqual(0);
        });

        it('has only one input on the page', function () {
          expect(fakeContent().find('input.barcodeInput').length).toEqual(1);
        });

        it('has information listed about the tube in a text tag', function () {
          var $text = fakeContent().find('ol li:first-child text#Text');
          expect($text.find('tspan').length).toEqual(3);

        });

        it('the tube has the following listed: Volume, aliquot Type, Barcode', function () {
          var $text = fakeContent().find('ol li:first-child text#Text');
          expect($text.find('#Volume_Text').length).toEqual(1);
          expect($text.find('#Type_Text').length).toEqual(1);
          expect($text.find('#Barcode_Text').length).toEqual(1);
        });

        it('displays the process title', function () {
          var $title = fakeContent().find('#process-title');
          expect($title.get(0).innerHTML).toEqual('Manual DNA and RNA Extraction');
        });

        it('has a user barcode display section', function () {
          expect(fakeContent().find('h3.pull-right').length).toEqual(1);
        });

        describe('and has another tube added', function () {

          beforeEach(function () {
            runs(function () {
              $fakeDOM.find("#content")
                .find('ol li:nth-child(2) input.barcodeInput')
                .val(1220017279668)
                .trigger(FakeUser.aPressReturnEvent());
            });

            runs(function () {
              results.resetFinishedFlag();
              FakeUser.waitsForIt($fakeDOM,
                "#content ol li:nth-child(2) div.resource svg",
                results.expected,
                results.unexpected
                );
            });

            waitsFor(results.hasFinished);

          });

          it('can add a tube successfully and have it display', function () {
            runs(function () {
              results.resetFinishedFlag();

              var $svg = fakeContent().find("ol li:nth-child(2) div.resource svg");
              expect($svg.length).toEqual(1);

              //expect the first tube to still be displayed!
              var $svg1 = fakeContent().find('ol li:first-child div.resource svg');
              expect($svg1.length).toEqual(1);
            });
          });

          it('after another tube is added, has a barcode scanner as the third element on the page', function () {
            runs(function () {
              var $thirdItemInList = fakeContent().find('ol li:nth-child(2)');
              expect($thirdItemInList.find('.barcodeScanner').length).toEqual(1);
            });
          })
        });
      });
    });
  });
});