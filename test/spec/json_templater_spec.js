define(['extraction_pipeline/lib/json_templater'], function (ArrayToJSON) {
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
        var template = {
          key1:  {
            "columnName": "name1",
            "type":       "integer",
            "optional":   true
          },
          stuff: {
            key2: {
              "columnName": "name2"}
          }
        };
        var combinedData = ArrayToJSON.applyTemplateToDataSet(data, template);
        var expectedData = [
          {key1: 1, stuff: {key2: 2}},
          {key1: 3, stuff: {key2: 4}}
        ];
        expect(combinedData).toEqual(expectedData);
      });
    });

    describe("When the combined header-data and array-template are combined", function () {
      it("produces the expected array of objects", function () {
        var data = [
          {name1: 1, name2: 2},
          {name1: 3, name2: 4}
        ];
        var template = [
          {
            key1: {
              "columnName": "name1",
              "type":       "integer",
              "optional":   true
            }
          },
          {
            stuff: {
              key2: {
                "columnName": "name2"}
            }
          }
        ];
        var combinedData = ArrayToJSON.applyTemplateToDataSet(data, template);
        var expectedData = [
          [
            {key1: 1},
            {stuff: {key2: 2}}
          ],
          [
            {key1: 3},
            {stuff: {key2: 4}}
          ]
        ];
        expect(combinedData).toEqual(expectedData);
      });
    });

    describe("When the combined header-data and template with fixed data are combined", function () {
      it("produces the expected array of objects with the fixed data", function () {
        var data = [
          {
            "COHORT":                                          "",
            "COMMON NAME":                                    "Homo Sapien",
            "DATE OF SAMPLE COLLECTION (MM/YY or YYYY only)": "",
            "FATHER (optional)":                              "",
            "GC CONTENT":                                     "",
            "GENDER":                                         "Male",
            "HMDMC":                                          "",
            "IS RE-SUBMITTED SAMPLE?":                        "No",
            "IS SAMPLE A CONTROL?":                           "No",
            "Lysed?":                                         "Yes",
            "MOTHER (optional)":                              "",
            "PUBLIC NAME":                                    "",
            "SAMPLE ACCESSION NUMBER (optional)":             "",
            "SAMPLE TYPE":                                    "Tissue Non-Tumour",
            "SANGER SAMPLE ID":                               "TEST_SANGER_ID1",
            "SIBLING (optional)":                             "",
            "STORAGE CONDITIONS":                             "",
            "SUPPLIER SAMPLE NAME":                           "TEST_SAMPLE_1",
            "TAXON ID":                                       "9606",
            "Tube Barcode":                                   "880000000000011",
            "VOLUME (ul)":                                    "1.2"
          }
        ];
        var template = {
          "tube_barcode":{"columnName":"Tube Barcode", "type":"string"},
          "public_name":{"columnName":"PUBLIC name", "type":"string", default:""},
          "volume":{"columnName":"Volume (ul)", "type":"float"},
          "details":{
            "gender":{
              "columnName":"gender"
            }
          }
        };
        var combinedData = ArrayToJSON.applyTemplateToDataSet(data, template);
        var expectedData = [
          {
            tube_barcode: "880000000000011",
            volume:1.2,
            details:{
                    "gender":"Male"
            }
          }
        ];
        expect(JSON.parse(JSON.stringify(combinedData))).toEqual(expectedData);
      });
    });
  });
});