//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
/* global sinon, describe, before, after, it, expect */
define([
  "test/lib/fake_user",
  "mapper_test/resource_test_helper"
], function (FakeUser, testHelper) {
  "use strict";

  testHelper(function (results) {

    describe("Fake user", function () {

      var $fakeDOM,
          fakeContent,
          bySideEffect = 0;

      $fakeDOM = $("<div><div id=\"content\"><div id=\"foo\"></div></div></div>");

      fakeContent = function () {
        return $fakeDOM.find("#content");
      };

      it("can inject HTML", function(done) {
        
        FakeUser.waitsForIt($fakeDOM,
          "#foo",
          function () {
            bySideEffect = 1;
            $fakeDOM.find("#foo").html("<span class=\"bar\"></span>");
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
