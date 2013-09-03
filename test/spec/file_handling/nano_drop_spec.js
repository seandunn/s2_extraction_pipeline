define([
  'lib/file_handling/nano_drop',
  'text!pipeline_testcsv/nanodrop.nr8'
], function(NanoDrop, inputData) {
  'use strict';

  return function() {
    describe("NanoDrop", function() {
      describe("to", function() {
        it("generates a TSV file", function() {
          var plate = {
            wells: {
              "A1": [{sample: {uuid: "UUID1"}}],
              "B1": [{sample: {uuid: "UUID2"}}]
            }
          };

          var result = NanoDrop.to(plate);
          var expected = "Well\tSanger ID\nA1\tUUID1\nB1\tUUID2";
          expect(result).to.equal(expected);
        });

        it("handles empty wells", function() {
          var plate = {
            wells: {
              "A1": [],
              "B1": [{sample: {uuid: "UUID2"}}]
            }
          };

          var result = NanoDrop.to(plate);
          var expected = "Well\tSanger ID\nB1\tUUID2";
          expect(result).to.equal(expected);
        });
      });

      describe("from", function() {
        var helper = function() {
          var sample = _.object(
            ["Sample ID", "Conc.", "260/280", "260/230"],
            _.drop(arguments)
          );
          return _.object([arguments[0], sample]);
        };

        var array = [], expected = [];
        beforeEach(function() {
          array = NanoDrop.from(inputData);
          expected = {
            "6250296910789": {
              "A1": {"Sample ID":"foo5546782", "Conc.": 1249.0, "260/280": 2.03, "260/230": 1.75},
              "B1": {"Sample ID":"foo5546783", "Conc.":  622.2, "260/280": 1.96, "260/230": 1.47},
              "C1": {"Sample ID":"foo5546784", "Conc.":  838.7, "260/280": 2.00, "260/230": 1.71},
              "D1": {"Sample ID":"foo5546785", "Conc.": 1138.0, "260/280": 2.03, "260/230": 1.82},
              "E1": {"Sample ID":"foo5546786", "Conc.":  578.1, "260/280": 1.96, "260/230": 1.43},
              "F1": {"Sample ID":"foo5546787", "Conc.":  529.6, "260/280": 2.00, "260/230": 1.58}
            }
          };
        });

        it("has the correct information", function() {
          expect(array).to.deep.equal(expected);
        });
      });
    });
  };
});
