define([
  'scripts/csv_parser'
  , 'config'
  , 'mapper/s2_root'
  , 'mapper_test/resource_test_helper'
  , 'text!testjson/unit/root.json'
  , 'text!pipelinetestjson/csv_parser_test_data.json'
], function (csvParser, config, Root, TestHelper, rootTestData, labellableTestData) {
//  'use strict';
  'use strict';
  TestHelper(function (results) {
    describe("CSV Parser,", function () {

      describe("when transforming CSV to an Array, ", function () {
        var data = [];
        var array = undefined;
        beforeEach(function () {
          data = " A01, \"FR1234567\"\nB01, \"FR234567890\"\n D01, \"FR334567890\"\n E01, \"FR434567890\"";
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
          expect(array[0][0]).toEqual("A01");
          expect(array[0][1]).toEqual("FR1234567");
          expect(array[1][0]).toEqual("B01");
          expect(array[1][1]).toEqual("FR234567890");
          expect(array[2][0]).toEqual("D01");
          expect(array[2][1]).toEqual("FR334567890");
          expect(array[3][0]).toEqual("E01");
          expect(array[3][1]).toEqual("FR434567890");
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
            "A01":{
              "barcode":"FR1234567890"
            },
            "B01":{
              "barcode":"FR2234567890"
            },
            "C01":{
              "barcode":"FR3234567890"
            },
            "D01":{
              "barcode":"FR4234567890"
            }
          };

          localisedRscs = csvParser.locationArrayToLocalisedBarcodes(data);
        });

        it("finds the right number of keys", function () {
          expect(_.keys(localisedRscs).length).toEqual(4);
        });

        it("returns the correct thingy", function () {
          expect(localisedRscs).toEqual(expectedResult);
        });
      })

      describe("when reading an array of location/barcode, ", function () {
        var data = [];
        var s2Root = undefined;
        var localisedRscs = undefined;
        var expectedResult = undefined;
        beforeEach(function () {
          data = [
            ["A01", "FR2345678901234"]
          ];
          localisedRscs = csvParser.locationArrayToLocalisedBarcodes(data);

          runs(function () {
            config.loadTestData(rootTestData);
            config.cummulativeLoadingTestDataInFirstStage(labellableTestData);
            Root.load({user:"username"})
                .then(function (root) {
                  results.assignTo('root')(root);
                  s2Root = results.get('root');
                })
                .then(results.expected)
                .fail(results.unexpected);
          });

          waitsFor(results.hasFinished);
        });


        it("can produce a hash of location/UUID",function () {
          runs(function () {
            results.resetFinishedFlag();
            csvParser.getRequestParamForMultipleBarcodeSearch(s2Root,localisedRscs)
                .then(results.assignTo('res'))
                .then(results.expected)
                .fail(results.unexpected);
          });

          waitsFor(results.hasFinished);

          runs(function () {
            var hash = results.get('res');
            expect(_.keys(hash).length).toEqual(1);
            expect(hash["A01"]).toBeDefined();
            expect(hash['A01'].barcode).toBeDefined();
            expect(hash['A01'].uuid).toBeDefined();
            expect(hash['A01'].barcode).toEqual("FR2345678901234");
            expect(hash['A01'].uuid).toEqual("11111111-2222-3333-4444-000000000000");
          });
        });
      });

    })
  });
});