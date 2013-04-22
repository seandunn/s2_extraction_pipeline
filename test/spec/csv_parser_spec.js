define(['scripts/csv_parser'], function (csvParser) {
//  'use strict';

  describe("CSV Parser", function () {


    describe(" when transforming CSV to an Array", function () {
      var data = [];
      var array = undefined;
      beforeEach(function () {
        data = " A1, \"1234567\"\nB1, \"234567890\"\n D1, \"334567890\"\n E1, \"434567890\"";
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
        expect(array[0][1]).toEqual("1234567");
        expect(array[1][0]).toEqual("B1");
        expect(array[1][1]).toEqual("234567890");
        expect(array[2][0]).toEqual("D1");
        expect(array[2][1]).toEqual("334567890");
        expect(array[3][0]).toEqual("E1");
        expect(array[3][1]).toEqual("434567890");
      });

    });


    describe(" when transforming the CSVArray to an javascript object", function () {
      var data = [];
      var localisedRscs = undefined;
      beforeEach(function () {

        data = [
          ["A1","1234567890"],
          ["B1","2234567890"],
          ["C1","3234567890"],
          ["E1","4234567890"]
        ];

        localisedRscs = csvParser.locationArrayToLocalisedResources(data);
      });

      it("finds the right number of keys", function () {
        expect(_.keys(localisedRscs).length).toEqual(4);
      });

//      it("finds the right number of keys", function () {
//        expect(localisedRscs.).toEqual(4);
//      });

    })
  })
});