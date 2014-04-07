/* global describe, beforeEach, it, expect */
define([
  "app-components/layouts/biorobot"
], function (bioRobotLayout) {
  "use strict";

  return describe("Biorobot layout", function () {
    describe("which is given one 24 input rack and one 96 plate destination", function () {
      it("returns the right layout for any location and at any position", function () {
        var locations = [];
        var beginLetterCode = "A".charCodeAt(0);
        for (var i=0; i<8; i++) {
          var letter = String.fromCharCode(beginLetterCode + i);
          for (var j=0; j<12; j++) {
            locations.push((letter + (j+1)));
          }
        }
        // We test a very small set of the possible inputs
        var map = [
                   { "A1": "A1", "A4": "E2"},
                   { "A1": "A4", "C4": "G5"},
                   { "A1": "A7", "B1": "B7", "B2": "F7", "B3": "B8"},
                   {  "A1": "A10", "D6": "H12"}
                   ];
        for (var numControllers = 0; numControllers<4; numControllers++) {
          for (var i=0; i<locations.length; i++) {
            var expectedValue = map[numControllers][locations[i]];
            if (expectedValue) {
              expect(bioRobotLayout.layoutDistribution({
                number_of_columns: 6,
                number_of_rows: 4
              }, [{
                number_of_columns: 12,
                number_of_rows: 8
              }], numControllers, locations[i])).to.equal(expectedValue);
            }
          }
        }
      });
    });
  });
});