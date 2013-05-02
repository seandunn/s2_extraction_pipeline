define([
  'scripts/csv_parser'
  , 'config'
  , 'mapper/s2_root'
  , 'mapper_test/resource_test_helper'
  , 'text!mapper_testjson/unit/root.json'
  , 'text!pipeline_testjson/csv_parser_test_data.json'
], function (csvParser, config, Root, TestHelper, rootTestData, labellableTestData) {
//  'use strict';
  'use strict';
  TestHelper(function (results) {
    describe("CSV Parser,", function () {

      describe("when transforming CSV with spaces to an Array, ", function () {
        var data = [];
        var array = undefined;
        beforeEach(function () {
          data = " A01, FR1234567\nB01, FR234567890\n D01, FR334567890\n E01, FR434567890";
          array = csvParser.csvToArray(data);
        });

        it("finds the right number of rows", function () {
          expect(array.length).toEqual(4);
        });

        it("finds the right number of columns", function () {
          expect(array[0].length).toEqual(2);
          expect(array[1].length).toEqual(2);
        });

        it("finds the right content", function () {
          expect(array[0][0]).toEqual("A1");
          expect(array[0][1]).toEqual("FR1234567");
          expect(array[1][0]).toEqual("B1");
          expect(array[1][1]).toEqual("FR234567890");
          expect(array[2][0]).toEqual("D1");
          expect(array[2][1]).toEqual("FR334567890");
          expect(array[3][0]).toEqual("E1");
          expect(array[3][1]).toEqual("FR434567890");
        });

      });

      describe("when transforming CSV with no space at all, ", function () {
        var data = [];
        var array = undefined;
        beforeEach(function () {
          data = "A01,FR1234567";
          array = csvParser.csvToArray(data);
        });

        it("finds the right number of rows", function () {
          expect(array.length).toEqual(1);
        });

        it("finds the right number of columns", function () {
          expect(array[0].length).toEqual(2);
          expect(array[0].length).toEqual(2);
        });

        it("finds the right content", function () {
          expect(array[0][0]).toEqual("A1");
          expect(array[0][1]).toEqual("FR1234567");
        });

      });


      describe("when transforming the CSVArray to an javascript object, ", function () {
        var data = [];
        var localisedRscs = undefined;
        var expectedResult = undefined;
        beforeEach(function () {

          data = [
            ["A01", "FR1234567890"],
            ["B01", "FR2234567890"],
            ["C01", "FR3234567890"],
            ["D01", "FR4234567890"]
          ];
          expectedResult = {
            "FR1234567890":"A01",
            "FR2234567890":"B01",
            "FR3234567890":"C01",
            "FR4234567890":"D01"
          };

          localisedRscs = csvParser.locationArrayToLocalisedBarcodes(data);
        });

        it("finds the right number of keys", function () {
          expect(_.keys(localisedRscs).length).toEqual(4);
        });

        it("returns the correct thingy", function () {
          expect(localisedRscs).toEqual(expectedResult);
        });
      });

    })
  });
});