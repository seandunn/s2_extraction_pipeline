define(['lib/file_handling/manifests'], function(Manifests) {
  'use strict';

  return function() {
    describe("Manifests", function(){
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
        var csvArray = Manifests.from(csvData);
        expect(csvArray[0][0]).to.equal("");
        expect(csvArray[2][0]).to.equal("880000000000011");
      });

      it("will give the same array if same data is given but where the outer whitespace differs", function(){
        var csvArray = Manifests.from(csvData);
        var csvArrayFromDataWithWhitespace = Manifests.from(csvDataWithWhitespace);
        expect(csvArray).to.deep.equal(csvArrayFromDataWithWhitespace);
      });

      it("does not remove whitespace between characters in individual data elements", function(){
        var csvArray = Manifests.from(csvData);
        expect(csvArray[1][0]).to.equal("Tube Barcode");
        expect(csvArray[1][2]).to.equal("SANGER SAMPLE ID");
      });
    });

    describe("Manifests (line endings)", function(){
      var csvDataWithSpacesAtEnd, csvDataWithSpacesInMiddle, csvDataWithMacLineEndings;
      beforeEach(function(){
        csvDataWithSpacesAtEnd = ",,,,,,,CGAP Lysed Material Manifest,,,,,,,,,,,,,\n"
          +"Tube Barcode,HMDMC,SANGER SAMPLE ID,SUPPLIER SAMPLE NAME,Lysed?,COHORT,VOLUME (ul),GENDER,DATE OF SAMPLE COLLECTION (MM/YY or YYYY only),IS SAMPLE A CONTROL?,IS RE-SUBMITTED SAMPLE?,STORAGE CONDITIONS,MOTHER (optional),FATHER (optional),SIBLING (optional),GC CONTENT,PUBLIC NAME,TAXON ID,COMMON NAME,SAMPLE TYPE,SAMPLE ACCESSION NUMBER (optional)\n"
          +"880000000000011,,TEST_SANGER_ID1,TEST_SAMPLE_1,Yes,,1.0,Male,,No,No,,,,,,,9606,Homo Sapien,Tissue Non-Tumour,\n\n\n\n";
        csvDataWithSpacesInMiddle = "a\na\n\na\n\na\n";
        csvDataWithMacLineEndings = "a\r\ra\r\ra\ra\r\r\r"
      });

      it("ignores newlines at the end of a csv file", function(){
        var csvArray = Manifests.from(csvDataWithSpacesAtEnd);
        expect(csvArray.length).to.equal(3);
      });

      it("does not ignore newlines in the middle of a csv file", function(){
        var csvArray = Manifests.from(csvDataWithSpacesInMiddle);
        expect(csvArray.length).to.equal(6);
      });

      it("deals with old mac style line endings", function(){
        var csvArray = Manifests.from(csvDataWithMacLineEndings);
        expect(csvArray.length).to.equal(6);
      });
    });
  };
});
