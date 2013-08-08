define([
  'lib/csv_parser'
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
          expect(array.length).to.equal(4);
        });

        it("finds the right number of columns", function () {
          expect(array[0].length).to.equal(2);
          expect(array[1].length).to.equal(2);
        });

        it("finds the right content", function () {
          expect(array[0][0]).to.equal("A1");
          expect(array[0][1]).to.equal("FR1234567");
          expect(array[1][0]).to.equal("B1");
          expect(array[1][1]).to.equal("FR234567890");
          expect(array[2][0]).to.equal("D1");
          expect(array[2][1]).to.equal("FR334567890");
          expect(array[3][0]).to.equal("E1");
          expect(array[3][1]).to.equal("FR434567890");
        });

      });

      describe("when transforming RackingCSV with no space at all, ", function () {
        var array = [];
        beforeEach(function () {
          var data = "A01,FR1234567";
          array = csvParser.rackingCsvToArray(data);
        });

        it("finds the right number of rows", function () {
          expect(array.length).to.equal(1);
        });

        it("finds the right number of columns", function () {
          expect(array[0].length).to.equal(2);
          expect(array[0].length).to.equal(2);
        });

        it("finds the right content", function () {
          expect(array[0][0]).to.equal("A1");
          expect(array[0][1]).to.equal("FR1234567");
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
          expect(_.keys(localisedRscs).length).to.equal(4);
        });

        it("returns the correct thingy", function () {
          expect(localisedRscs).to.deep.equal(expectedResult);
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
          expect(rack_barcode).to.equal("1220214083760");
        });

        it("finds the right number of rows", function () {
          expect(array.length).to.equal(3);
        });

        it("finds the right number of columns", function () {
          expect(array[0].length).to.equal(2);
          expect(array[1].length).to.equal(2);
        });

        it("finds the right content", function () {
          expect(array[0][0]).to.equal("A1");
          expect(array[0][1]).to.equal(0.8960);
          expect(array[1][0]).to.equal("B1");
          expect(array[1][1]).to.equal(0.5985);
          expect(array[2][0]).to.equal("C1");
          expect(array[2][1]).to.equal(23.3150);
        });
      });
    });

    describe("A ManifestCSV parser", function(){
      var csvData, csvDataWithWhitespace;
      beforeEach(function(){
        csvData = ",,,,,,,CGAP Lysed Material Manifest,,,,,,,,,,,,,\n"
          +"Tube Barcode,HMDMC,SANGER SAMPLE ID,SUPPLIER SAMPLE NAME,Lysed?,COHORT,VOLUME (ul),GENDER,DATE OF SAMPLE COLLECTION (MM/YY or YYYY only),IS SAMPLE A CONTROL?,IS RE-SUBMITTED SAMPLE?,STORAGE CONDITIONS,MOTHER (optional),FATHER (optional),SIBLING (optional),GC CONTENT,PUBLIC NAME,TAXON ID,COMMON NAME,SAMPLE TYPE,SAMPLE ACCESSION NUMBER (optional)\n"
          +"880000000000011,,TEST_SANGER_ID1,TEST_SAMPLE_1,Yes,,1.0,Male,,No,No,,,,,,,9606,Homo Sapien,Tissue Non-Tumour,";

        csvDataWithWhitespace = ", , , , , , ,CGAP Lysed Material Manifest , , , , , , , , , , , , , \n"
          +"Tube Barcode, HMDMC, SANGER SAMPLE ID, SUPPLIER SAMPLE NAME,Lysed?,COHORT,VOLUME (ul),GENDER,DATE OF SAMPLE COLLECTION (MM/YY or YYYY only),IS SAMPLE A CONTROL?,IS RE-SUBMITTED SAMPLE?,STORAGE CONDITIONS,MOTHER (optional),FATHER (optional),SIBLING (optional),GC CONTENT,PUBLIC NAME,TAXON ID,COMMON NAME,SAMPLE TYPE,SAMPLE ACCESSION NUMBER (optional)\n"
          +"880000000000011  , , TEST_SANGER_ID1, TEST_SAMPLE_1,Yes,,1.0,Male,,No,No,,,,,,,9606,Homo Sapien,Tissue Non-Tumour,";
      });

      it("can parse a manifest CSV into an array", function(){
        var csvArray = csvParser.manifestCsvToArray(csvData);
        expect(csvArray[0][0]).to.equal("");
        expect(csvArray[2][0]).to.equal("880000000000011");
      });

      it("will give the same array if same data is given but where the outer whitespace differs", function(){
        var csvArray = csvParser.manifestCsvToArray(csvData);
        var csvArrayFromDataWithWhitespace = csvParser.manifestCsvToArray(csvDataWithWhitespace);
        expect(csvArray).to.deep.equal(csvArrayFromDataWithWhitespace);
      });

      it("does not remove whitespace between characters in individual data elements", function(){
        var csvArray = csvParser.manifestCsvToArray(csvData);
        expect(csvArray[1][0]).to.equal("Tube Barcode");
        expect(csvArray[1][2]).to.equal("SANGER SAMPLE ID");
      });

    });

    describe("A ManifestCSV parser also", function(){
      var csvDataWithSpacesAtEnd, csvDataWithSpacesInMiddle, csvDataWithMacLineEndings;
      beforeEach(function(){
        csvDataWithSpacesAtEnd = ",,,,,,,CGAP Lysed Material Manifest,,,,,,,,,,,,,\n"
          +"Tube Barcode,HMDMC,SANGER SAMPLE ID,SUPPLIER SAMPLE NAME,Lysed?,COHORT,VOLUME (ul),GENDER,DATE OF SAMPLE COLLECTION (MM/YY or YYYY only),IS SAMPLE A CONTROL?,IS RE-SUBMITTED SAMPLE?,STORAGE CONDITIONS,MOTHER (optional),FATHER (optional),SIBLING (optional),GC CONTENT,PUBLIC NAME,TAXON ID,COMMON NAME,SAMPLE TYPE,SAMPLE ACCESSION NUMBER (optional)\n"
          +"880000000000011,,TEST_SANGER_ID1,TEST_SAMPLE_1,Yes,,1.0,Male,,No,No,,,,,,,9606,Homo Sapien,Tissue Non-Tumour,\n\n\n\n";
        csvDataWithSpacesInMiddle = "a\na\n\na\n\na\n";
        csvDataWithMacLineEndings = "a\r\ra\r\ra\ra\r\r\r"
      });

      it("ignores newlines at the end of a csv file", function(){
        var csvArray = csvParser.manifestCsvToArray(csvDataWithSpacesAtEnd);
        expect(csvArray.length).to.equal(3);
      });

      it("does not ignore newlines in the middle of a csv file", function(){
        var csvArray = csvParser.manifestCsvToArray(csvDataWithSpacesInMiddle);
        expect(csvArray.length).to.equal(5);
      });

      it("deals with old mac style line endings", function(){
        var csvArray = csvParser.manifestCsvToArray(csvDataWithMacLineEndings);
        expect(csvArray.length).to.equal(5);
      });
    });
  });
});
