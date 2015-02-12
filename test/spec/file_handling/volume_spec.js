//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  'lib/file_handling/volume'
], function (Volume) {
  'use strict';

  return function() {
    describe("Volume", function(){
      describe("when transforming VolumeCSV with spaces to an Array, ", function () {
        var result = undefined, expected = undefined;

        beforeEach(function () {
          var data = "RACKID,TUBE,VOLAVG\n1220214083760,A01,0.8960\n1220214083760,B01,0.5985\n1220214083760,C01,23.3150";
          result = Volume.from(data);
          expected = {
            rack_barcode: "1220214083760",
            tubes: [
              ["A1",0.8960],
              ["B1",0.5985],
              ["C1",23.3150]
            ]
          };
        });

        it("has the correct information", function() {
          expect(result).to.deep.equal(expected);
        });
      });
    });
  };
});
