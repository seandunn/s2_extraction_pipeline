define([
  "lib/underscore_extensions"
  , "config"
  , "mapper_test/resource_test_helper"
], function(Handling, Config, TestHelper) {
  'use strict';

  TestHelper(function(results) {
    describe("underscore extensions (csv handling)", function() {
      describe("plus", function() {
        it("is map by default", function() {
          expect(_.plus(["a","b","c","d"], _.identity)).to.deep.equal(["a","b","c","d"]);
        })

        it("applies the function", function() {
          expect(_.plus(["a","aa","aaa"], function(v) { return v.length; })).to.deep.equal([1,2,3]);
        });
      });

      describe("restructure", function() {
        it("deals with flat templates", function() {
          expect(_.restructure({
            "OA": "IA",
            "OB": "IB"
          }, {
            "IA": 1,
            "IB": 2
          })).to.deep.equal({
            "OA": 1,
            "OB": 2
          });
        });

        it("deals with nested templates", function() {
          expect(_.restructure({
            "OA": {"A": "IA"},
            "OB": {"B": "IB"}
          }, {
            "IA": 1,
            "IB": 2
          })).to.deep.equal({
            "OA": {"A": 1},
            "OB": {"B": 2}
          });
        });
      });

      describe("mapFields", function() {
        it("applies the function to the fields", function() {
          expect(_.mapFields({
            a: function(v) { return "a" + v; },
            b: function(v) { return "b" + v; },
            d: function(v) { return "d" + v; }
          }, {
            a: "a",
            b: "b",
            c: "c"
          })).to.deep.equal({
            a: "aa",
            b: "bb",
            c: "c"
          });
        });
      });

      describe("mapIndexes", function() {
        it("applies the function to the indexes", function() {
          expect(_.mapIndexes([
            [0, function(v) { return "0" + v; }],
            [1, function(v) { return "1" + v; }],
            [3, function(v) { return "3" + v; }]
          ], ["a","b","c"])).to.deep.equal(["0a","1b","c"]);
        });
      });

      describe("untabularize", function() {
        it("turns the tablular data into an array of objects", function() {
          expect(_.untabularize([
            ["A","B","C"],
            [1,2,3],
            [4,5,6]
          ])).to.deep.equal([
            {"A":1, "B":2, "C":3},
            {"A":4, "B":5, "C":6},
          ]);
        });
      });

      describe("tabularize", function() {
        it("turns the objects into tabular data", function() {
          expect(_.tabularize([
            {"A":1, "B":2, "C":3},
            {"A":4, "B":5, "C":6},
          ], ["A","B","C"])).to.deep.equal([
            ["A","B","C"],
            [1,2,3],
            [4,5,6]
          ]);
        });
      });

      describe("toCSV", function() {
        _.map([",","\t"], function(separator) {
          it("uses '" + separator + "' as the separator", function() {
            expect(_.toCSV([
              ["A","B","C"],
              [1,2,3],
              [4,5,6]
            ], separator)).to.deep.equal([
              ["A","B","C"].join(separator),
              [1,2,3].join(separator),
              [4,5,6].join(separator)
            ].join("\n"));
          });
        });

        it("quotes fields with the separator", function() {
          expect(_.toCSV([["A,B"]],",")).to.deep.equal("\"A,B\"");
        });
      });

      describe("parseAsSeparatedRows", function() {
        _.map([",","\t"], function(separator) {
          _.map(["\r","\r\n","\n"], function(ending) {
            it("deals with '" + separator +"' as a separator and '"+ending+"' as a line ending", function() {
              expect(_.parseAsSeparatedRows([
                ["1","2","3"].join(separator),
                ["4","5","6"].join(separator)
              ].join(ending), separator)).to.deep.equal([
                ["1","2","3"],
                ["4","5","6"]
              ]);
            });
          });
        });

        it("drops blank lines from the end only", function() {
          expect(_.parseAsSeparatedRows("a\nb\n\nc\nd\n\n\n", ",")).to.deep.equal([
            ["a"],
            ["b"],
            [""],
            ["c"],
            ["d"]
          ]);
        });

        describe("deals with quoted fields", function() {
          it("removes quote marks", function() {
            expect(_.parseAsSeparatedRows("\"a\"", ",")).to.deep.equal([ ["a"] ]);
          });

          it("does not remove whitespace inside", function() {
            expect(_.parseAsSeparatedRows("\" a \"", ",")).to.deep.equal([ [" a "] ]);
          });

          it("handles whitespace around quotes", function() {
            expect(_.parseAsSeparatedRows(" \"a\" ", ",")).to.deep.equal([ ["a"] ]);
          });

          it("handles separator inside quotes", function() {
            expect(_.parseAsSeparatedRows("\"a,b\"", ",")).to.deep.equal([ ["a,b"] ]);
          });

          it("handles multiple separators inside quotes", function() {
            expect(_.parseAsSeparatedRows("\"a,b,c\"", ",")).to.deep.equal([ ["a,b,c"] ]);
          });
        });
      });
    });

    describe("Utility", function() {
      describe("Reverse range", function() {
        it("will return an array of reversed numbers", function() {
          expect(_.reverseRange(5)).to.deep.equal([4,3,2,1,0]);
        })
      });
    });

  });
});
