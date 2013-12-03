/* global describe, beforeEach, it, expect */
define([
  "lib/file_handling/tecan",
  "mapper/s2_root"
], function(tecanHandler, root) {
  "use strict";

  return function() {
  
    describe("Tecan Files", function() {
      var tecanData, tecanFile, layoutTestFile;
  
      beforeEach(function(done) {
        var files = {};
  
        $.when.apply(
          this,
          _.map([ "../test/data/gwl/127073.gwl",
              "../test/data/gwl/127073.json",
              "../test/data/gwl/layout_test.gwl"
          ], function(path) {
            return $.ajax(path,
              { success : _.partial(function(url, data) {
                files[url] = data;
              }, path)
              }).promise();
          })).then(function() {

            tecanFile = files["../test/data/gwl/127073.gwl"];
            tecanData = files["../test/data/gwl/127073.json"];
            layoutTestFile = files["../test/data/gwl/layout_test.gwl"];
          
            done();
          });
      });
  
      it("can create a Tecan File from a predefined layout", function() {
        var tecanParsing = tecanHandler.parse(tecanData);
        var result = tecanParsing.match(tecanFile);
        expect(result).to.not.be.null;
      });

      it.skip("can do a new layout from a list of sources and a destination", function(done) {
        var destination =
          { number_of_rows : 12, number_of_columns : 8, labels :
            { barcode :
              { value : "12345"
              }
            }, tubes : {}
          };

        var userName = "TEST_USER_1";

        root.load({
          user : userName
        }).done(function(results) {
          results.findByLabEan13("3960299138815")
            .done(function(source) {
              var parsing = tecanHandler.to([source], destination, userName, "Wed Oct 16 2013 16:33:33 GMT+0100 (BST)");
              expect(parsing).to.equal(layoutTestFile);
              done();
            });
        });
          
      });
    });
  };
});
