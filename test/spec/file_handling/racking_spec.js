define([
  'lib/file_handling/racking'
], function(Racking) {
  'use strict';

  return function() {
    describe("Racking", function () {
      describe("when transforming RackingCSV with spaces to an Array, ", function () {
        var result = undefined, expected = undefined;
        beforeEach(function () {
          var data = " A01, FR1234567\nB01, FR234567890\n D01, FR334567890\n E01, FR434567890";
          result = Racking.from(data);
          expected = {
            "FR1234567":   "A1",
            "FR234567890": "B1",
            "FR334567890": "D1",
            "FR434567890": "E1"
          };
        });

        it("has the correct information", function() {
          expect(result).to.deep.equal(expected);
        });
      });

      describe("when transforming RackingCSV with no space at all, ", function () {
        var result = undefined, expected = undefined;
        beforeEach(function () {
          var data = "A01,FR1234567";
          result = Racking.from(data);
          expected = {"FR1234567": "A1"};
        });

        it("has the correct information", function() {
          expect(result).to.deep.equal(expected);
        });
      });


      describe("when transforming the CSVArray to an javascript object, ", function () {
        var result = undefined, expected = undefined;
        beforeEach(function () {
          var data = "A01,FR1234567890\nB01,FR2234567890\nC01,FR3234567890\nD01,FR4234567890";
          result = Racking.from(data);
          expected = {
            "FR1234567890":"A1",
            "FR2234567890":"B1",
            "FR3234567890":"C1",
            "FR4234567890":"D1"
          };
        });

        it("has the correct information", function() {
          expect(result).to.deep.equal(expected);
        });
      });
    });
  };
});
