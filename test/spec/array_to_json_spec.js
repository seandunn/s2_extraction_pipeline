define(['extraction_pipeline/lib/array_to_json'], function (ArrayToJSON) {
  'use strict';

  describe("ArrayToJSON module", function () {

    describe("When headers and data are combined into an array", function () {
      it("produces the expected array of objects", function () {
        var cols = ["name1", "name2"];
        var data = [
          [1, 2],
          [3, 4]
        ];
        var expected = [
          {name1: 1, name2: 2},
          {name1: 3, name2: 4}
        ];
        expect(ArrayToJSON.combineHeadersToData(cols, data)).toEqual(expected);
      });

      it("produces the expected array of objects with a decoration", function () {
        var cols = ["name1", "name2"];
        var data = [
          [1, 2],
          [3, 4]
        ];
        var expected = [
          {_DECORATION_name1: 1, _DECORATION_name2: 2},
          {_DECORATION_name1: 3, _DECORATION_name2: 4}
        ];
        expect(ArrayToJSON.combineHeadersToData(cols, data, "_DECORATION_")).toEqual(expected);
      });
    });

    describe("When the combined header-data and template are combined", function () {
      it("produces the expected array of objects", function () {
        var data = [
          {name1: 1, name2: 2},
          {name1: 3, name2: 4}
        ];
        var template = {key1: "name1", stuff: {key2: "name2"}};
        var combinedData = ArrayToJSON.arrayToJSON(data, template);
        var expectedData = [
          {key1: 1, stuff: {key2: 2}},
          {key1: 3, stuff: {key2: 4}}
        ];
        expect(combinedData).toEqual(expectedData);
      });
    });

    describe("When the combined header-data and template with fixed data are combined", function () {
      it("produces the expected array of objects with the fixed data", function () {
        var data = [
          {
            "_WILL_BE_REPLACED_COHORT":                                          "",
            "_WILL_BE_REPLACED_COMMON NAME":                                    "Homo Sapien",
            "_WILL_BE_REPLACED_DATE OF SAMPLE COLLECTION (MM/YY or YYYY only)": "",
            "_WILL_BE_REPLACED_FATHER (optional)":                              "",
            "_WILL_BE_REPLACED_GC CONTENT":                                     "",
            "_WILL_BE_REPLACED_GENDER":                                         "Male",
            "_WILL_BE_REPLACED_HMDMC":                                          "",
            "_WILL_BE_REPLACED_IS RE-SUBMITTED SAMPLE?":                        "No",
            "_WILL_BE_REPLACED_IS SAMPLE A CONTROL?":                           "No",
            "_WILL_BE_REPLACED_Lysed?":                                         "Yes",
            "_WILL_BE_REPLACED_MOTHER (optional)":                              "",
            "_WILL_BE_REPLACED_PUBLIC NAME":                                    "",
            "_WILL_BE_REPLACED_SAMPLE ACCESSION NUMBER (optional)":             "",
            "_WILL_BE_REPLACED_SAMPLE TYPE":                                    "Tissue Non-Tumour",
            "_WILL_BE_REPLACED_SANGER SAMPLE ID":                               "TEST_SANGER_ID1",
            "_WILL_BE_REPLACED_SIBLING (optional)":                             "",
            "_WILL_BE_REPLACED_STORAGE CONDITIONS":                             "",
            "_WILL_BE_REPLACED_SUPPLIER SAMPLE NAME":                           "TEST_SAMPLE_1",
            "_WILL_BE_REPLACED_TAXON ID":                                       "9606",
            "_WILL_BE_REPLACED_Tube Barcode":                                   "880000000000011",
            "_WILL_BE_REPLACED_VOLUME (ul)":                                    "1.0"
          }
        ];
        var template = {
          "tube_barcode":"_WILL_BE_REPLACED_Tube Barcode",
          "stuff":35
        };
        var combinedData = ArrayToJSON.arrayToJSON(data, template);
        var expectedData = [
          {tube_barcode: "880000000000011", stuff: 35}
        ];
        expect(combinedData).toEqual(expectedData);
      });
    });




    describe("The check for whether an object contains a decorator string", function(){
      it("Doesn't return a false positive", function(){
        var goodData = [{ "Tube_Barcode":"1234567890123", "Sample_Type":"DNA" }];
        expect(ArrayToJSON.containsDecorator(goodData, "_DECORATOR_")).toEqual(false);
      });

      it("Finds a decorator string in a flat object", function(){
        var badData = [{ "Tube_Barcode":"_DECORATOR_1234567890123", "Sample_Type":"DNA" }];
        expect(ArrayToJSON.containsDecorator(badData, "_DECORATOR_")).toEqual(true);
      });

      it("Finds a decorator string in a nested object", function(){
        var nestedBadData = [{ "Tube_Barcode":"1234567890123", stuff:{"Sample_Type":"_DECORATOR_DNA" }}];
        expect(ArrayToJSON.containsDecorator(nestedBadData, "_DECORATOR_")).toEqual(true);
      });
    });
  });
});