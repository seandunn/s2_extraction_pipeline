//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define(['lib/util'], function (Util) {
  describe("The deepMergeFunction", function () {

    var util = Object.create(Util);

    it("merges two flat objects", function () {
      // setup data
      var firstObject = {
        "greeting": "annyong",
        "money":    500
      };
      var secondObject = {
        "language": "Korean",
        "currency": "pounds"
      };

      var expected = {
        "greeting": "annyong",
        "money":    500,
        "language": "Korean",
        "currency": "pounds"
      };

      // expectation
      expect(util.deepMerge(firstObject, secondObject)).to.deep.equal(expected);
    });

    it("merges nested objects recursively", function () {
      // setup data
      var firstObject = {
        stuff: {"greeting": "annyong"},
        bank:  {
          account: {
            "money":  500,
            "number": 123456
          }
        }
      };
      var secondObject = {
        stuff:      {"language": "Korean"},
        "currency": "pounds"
      };

      var expected = {
        stuff:      {
          "greeting": "annyong",
          "language": "Korean"
        },
        bank:       {
          account: {
            "money":  500,
            "number": 123456
          }
        },
        "currency": "pounds"
      };

      // expectation
      expect(util.deepMerge(firstObject, secondObject)).to.deep.equal(expected);
    });

    it("when there is a clash in key, it chooses the value of the second object", function () {
      // setup data
      var firstObject = {
        stuff: {
          "greeting": "annyong",
          "copy":     "this won't be merged :("
        },
        bank:  {
          account: {
            "money":  500,
            "number": 123456
          }
        }
      };
      var secondObject = {
        stuff:      {
          "language": "Korean",
          // this should overwrite
          "copy":     "this will be merged :)"
        },
        "currency": "pounds",
        bank:       {
          account: {
            money:1000,
            // this should change nothing
            number: 123456
          }
        }
      };

      var expected = {
        stuff:      {
          "greeting": "annyong",
          "language": "Korean",
          "copy":     "this will be merged :)"
        },
        bank:       {
          account: {
            "money":  1000,
            "number": 123456
          }
        },
        "currency": "pounds"
      };

      // expectation
      expect(util.deepMerge(firstObject, secondObject)).to.deep.equal(expected);
    });
  });
});
