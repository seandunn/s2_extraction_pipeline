define([
  'lib/fake_user'
  , 'mapper_test/resource_test_helper'
], function (FakeUser, TestHelper) {
  'use strict';


  TestHelper(function (results) {

    var $fakeDOM, fakeContent;
    describe("Fake user", function () {

      it("will wait for something to happen on the DOM before taking action", function () {
        var bySideEffect = 0;
        runs(function () {
          results.resetFinishedFlag();
          $fakeDOM = $('<div><div id="content"></div></div>');

          fakeContent = function () {
            return $fakeDOM.find("#content");
          };

          (function () {
            var p = $.Deferred();
            $.ajax("http://www.google.jp")
              .then(function () {
                $fakeDOM.find("#content").html("<div id='foo'></div>");
                p.resolve();
              }).fail(function () {
                $fakeDOM.find("#content").html("<div id='foo'></div>");
                p.reject();
              });
            return p.promise();
          })()
            .then(results.unexpected)
            .fail(results.expected);
        });

        waitsFor(results.hasFinished);

        runs(function () {
          results.resetFinishedFlag();
          FakeUser.waitsForIt($fakeDOM,
            "#foo",
            function () {
              bySideEffect = 1;
              $fakeDOM.find("#foo").html("<span class='bar'></span>");
            })
            .then(results.expected)
            .fail(results.unexpected);
        });

        waitsFor(results.hasFinished);

        runs(function () {
          results.resetFinishedFlag();
          expect(bySideEffect).toEqual(1);
          expect(fakeContent().find(".bar").get(0)).toBeDefined();
        });
      });
    });
  });
});
