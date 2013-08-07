define([
  'lib/fake_user'
  , 'mapper_test/resource_test_helper'
], function (FakeUser, TestHelper) {
  'use strict';

  TestHelper(function (results) {

    var $fakeDOM, 
        fakeContent,
        bySideEffect = 0;

    describe("Fake user", function () {

      it("will wait for something to happen on the DOM before taking action", function (done) {
        
        this.timeout(5000);

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
        .then(function() {
          results.unexpected();
        })
        .fail(function() {
          results.expected();
          results.expectToBeCalled();
        })
        .always(done);

      });

      it("can inject HTML", function(done) {
        
        results.resetFinishedFlag();

        FakeUser.waitsForIt($fakeDOM,
          "#foo",
          function () {
            bySideEffect = 1;
            $fakeDOM.find("#foo").html("<span class='bar'></span>");
        })
          .then(function() {
            results.expected();
            expect(fakeContent().find(".bar").get(0)).to.not.be.undefined;
          })
          .fail(function() {
            results.unexpected();
          })
          .always(done);
      });

      it("can see that FakeUser sets up a \"side effect\"", function() {
        expect(bySideEffect).to.equal(1);
      });
    });
  });
});
