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
    describe("RackingCSV Parser,", function () {

      describe("when transforming RackingCSV with spaces to an Array, ", function () {
        var array = [];
        beforeEach(function () {
          var data = " A01, FR1234567\nB01, FR234567890\n D01, FR334567890\n E01, FR434567890";
          array = csvParser.rackingCsvToArray(data);
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

      describe("when transforming RackingCSV with no space at all, ", function () {
        var array = [];
        beforeEach(function () {
          var data = "A01,FR1234567";
          array = csvParser.rackingCsvToArray(data);
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
        var localisedRscs = [];
        var expectedResult = [];
        beforeEach(function () {

          var data = [
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

    });

    describe("VolumeCSV Parser,", function(){

      describe("when transforming VolumeCSV with spaces to an Array, ", function () {
        var output, array ,rack_barcode;
        beforeEach(function () {
          var data = "RACKID,TUBE,VOLAVG\n1220214083760,A01,0.8960\n1220214083760,B01,0.5985\n1220214083760,C01,23.3150";
          output = csvParser.volumeCsvToArray(data);
          array = output.array;
          rack_barcode = output.rack_barcode;
        });

        it("finds the right rack ID", function () {
          expect(rack_barcode).toEqual("1220214083760");
        });

        it("finds the right number of rows", function () {
          expect(array.length).toEqual(3);
        });

        it("finds the right number of columns", function () {
          expect(array[0].length).toEqual(2);
          expect(array[1].length).toEqual(2);
        });

        it("finds the right content", function () {
          expect(array[0][0]).toEqual("A1");
          expect(array[0][1]).toEqual(0.8960);
          expect(array[1][0]).toEqual("B1");
          expect(array[1][1]).toEqual(0.5985);
          expect(array[2][0]).toEqual("C1");
          expect(array[2][1]).toEqual(23.3150);
        });

      });
    })
  });
});