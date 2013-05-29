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
  });
});