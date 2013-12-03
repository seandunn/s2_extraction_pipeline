/* global describe, beforeEach, it, expect */
define([
  "config",
  "test/lib/fake_user",
  "mapper_test/resource_test_helper",
  "mapper/s2_root",
  "models/selection_page_model",
  "controllers/selection_page_controller",
  "controllers/controller_factory",
  "lib/pubsub",
  "text!mapper_testjson/unit/root.json",
  "text!pipeline_testjson/selection_page_data.json"
], function (config, FakeUser, testHelper, S2Root, SelectionPageModel,
             SelectionPageController, ControllerFactory, PubSub,
             rootTestData, selectionPageData) {
  "use strict";

  testHelper(function (results) {

    describe("Selection page controller", function () {

      var s2Root, app, controller, fakeContent, $fakeDOM;

      before(function () {
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

        var controllerName = "selection_page_controller";

        $fakeDOM = $("<div><div id=\"content\"/></div></div>");

        fakeContent = function () {
          return $fakeDOM.find("#content");
        };

        var initData = {
          "accepts":       [ "samples.extraction.manual.dna_and_rna.input_tube_nap" ],
          "controllerName": "selection_page_controller",
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
        var pf = new ControllerFactory();
        controller = pf.create(controllerName, app, initData);
      });

      var model;

      describe("which is given one tube", function () {

        before(function (done) {
          config.loadTestData(selectionPageData);
          config.cummulativeLoadingTestDataInFirstStage(rootTestData);
        
          results.resetFinishedFlag();

          app.getS2Root()
            .then(function (root) {
              return root.find("tube1UUID");
            })
            .then(function (initialLabware) {
              model = {
                user:    "123456789",
                labware: initialLabware
              };

            })
            .then(results.expected)
            .fail(results.unexpected)
            .always(done);
        });

        beforeEach(function() {
          results.resetFinishedFlag();
          controller.setupController(model, function () {
            return fakeContent();
          });
          results.expected();
        });
        
        beforeEach(function() {
          PubSub.removeAll("error.status.s2");
        });

        it("displays a tube", function () {
          var $tube = fakeContent().find("ol li:first-child .resource");
          expect($tube.get(0).innerHTML).to.not.equal("");
          expect($tube.find("svg").length).to.equal(1);
        });

        it("does not show more than one tube", function () {
          var $resources = fakeContent().find("svg");
          _.chain($resources)
            .drop(1)
            .each(function (resource) {
              var $resource = $(resource);
              expect($resource.find("svg").length).to.equal(0);
            });
        });

        it("the HTML has been changed from when it was initialised", function () {
          var $initialFakeDOM = $("<div><div id=\"content\"/></div>");
          expect(fakeContent()).to.not.equal($initialFakeDOM);
        });

        it("sends an error message if the tube isn't found", function (done) {
        
          PubSub.subscribe("error.status.s2", function (event, source, eventData) {
            expect(eventData.message).to.equal("Couldn't find the resource related to this barcode");
            done();
          });

          fakeContent()
              .find("ol li:nth-child(2) input.barcodeInput")
              .val(1234567890123)
              .trigger(FakeUser.aPressReturnEvent());
        });

        it("sends an error message if the tube has already been entered", function (done) {
          
          PubSub.subscribe("error.status.s2", function (event, source, eventData) {
            expect(eventData.message).to.equal("You cannot add the same tube twice.");
            done();
          });

          fakeContent()
            .find("ol li:nth-child(2) input.barcodeInput")
            .val(1220017279667)
            .trigger(FakeUser.aPressReturnEvent());
        });

        it("sends an error message if the tube has the wrong aliquot", function (done) {
          
          PubSub.subscribe("error.status.s2", function (event, source, eventData) {
            expect(eventData.message).to.equal("You can only add \"NA+P\" inputs into this batch. The scanned barcode corresponds to a \"DNA+P\" input.");
            done();
          });

          fakeContent()
            .find("ol li:nth-child(2) input.barcodeInput")
            .val(1220017279670)
            .trigger(FakeUser.aPressReturnEvent());

        });

        it("sends an error message if the tube has the wrong role", function (done) {
          
          PubSub.subscribe("error.status.s2", function (event, source, eventData) {
            expect(eventData.message).to.equal("This tube cannot be added to the current batch, because it does not have the correct role.");
            done();
          });

          fakeContent()
              .find("ol li:nth-child(2) input.barcodeInput")
              .val(1220017279671)
              .trigger(FakeUser.aPressReturnEvent());
      
        });
      
        it("has an ordered list with 12 list elements in the view", function () {
          var $selection = fakeContent();
          expect($selection.find("ol>li").length).to.equal(12);
        });

        it("removes the tube when the its remove button is clicked", function () {
          var $removeBtn = fakeContent().find("ol li").first();

          expect($removeBtn.find("svg").length).to.equal(1);
          $removeBtn.find("button").trigger("click");

          var $removeBtnPostClick = fakeContent().find("ol li").first();
          expect($removeBtnPostClick.find("svg").length).to.equal(0);
        });

        it("has only one input on the page", function () {
          expect(fakeContent().find("input.barcodeInput").length).to.equal(1);
        });

        it("has information listed about the tube in a text tag", function () {
          var $text = fakeContent().find("ol li:first-child text");
          expect($text.length).to.equal(3);
        });

        it("the tube has the following listed: Volume, Aliquot Type, Barcode", function () {
          var $text = fakeContent().find("ol li:first-child");

          expect($text.find("text.volume").length).to.equal(1);
          expect($text.find("text.type").length).to.equal(1);
          expect($text.find("text.barcode").length).to.equal(1);
        });

        it("displays the process title", function () {
          var $title = fakeContent().find("#process-title");
          expect($title.get(0).innerHTML).to.equal("Manual DNA and RNA Extraction");
        });

        it("has a user barcode display section", function () {
          expect(fakeContent().find("h4.pull-right").length).to.equal(1);
        });

        describe("and has another tube added", function () {

          beforeEach(function () {

            $fakeDOM.find("#content")
              .find("ol>li:nth-child(2) input.barcodeInput")
              .val(1220017279668)
              .trigger(FakeUser.aPressReturnEvent());
          });

          beforeEach(function(done) {
            results.resetFinishedFlag();

            FakeUser.waitsForIt($fakeDOM,
              "#content ol>li:nth-child(2) div.resource svg",
              function() { results.expected(); done(); },
              function() { results.unexpected(); done(); }
              );
          });

          it("can add a tube successfully and have it display", function () {
              results.resetFinishedFlag();

              var $svg = fakeContent().find("ol>li:nth-child(2) div.resource svg");
              expect($svg.length).to.equal(1);

              //expect the first tube to still be displayed!
              var $svg1 = fakeContent().find("ol>li:first-child div.resource svg");
              expect($svg1.length).to.equal(1);
          });

          it("after another tube is added, has a barcode scanner as the third element on the page", function () {
            var $thirdItemInList = fakeContent().find("ol>li:nth-child(3) input");
            expect($thirdItemInList.length).to.equal(1);
          });
        });
      });
    });
  });
});