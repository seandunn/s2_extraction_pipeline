//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
  "lib/reception_templates/generators/vial",
  "text!pipeline_testjson/vial_spec_fixtures.json"
], function(VialGenerator, VialJSON) {

  describe("Vial Generator", function() {
    var vial, fixtures;

    before(function() {
      fixtures = JSON.parse(VialJSON);
      vial = new VialGenerator.vial({model: "vial"}, _.ignore);
    });

    describe("Prepare", function() {

      var prepFixtures;

      before(function() {
        prepFixtures = fixtures.prepare;
      });

      it("can place samples correctly", function() {

        vial.prepare(_.ignore, _.ignore, {number_of_labwares: 1, viles_per_sample: 2}, 
          function(registerSamples, registerBarcodes, placeSamples, labelForBarcode) {
            expect(placeSamples(prepFixtures.samples, prepFixtures.barcodes, "Blood")).to.deep.equal(prepFixtures.expect);
        });

      });
    });

    describe("Create", function() {
      var createFixtures;

      before(function() {
        createFixtures = fixtures.create;
      });

      it("can create the data necessary for a manifest", function() {
        expect(vial.manifest(createFixtures.rows, {})).to.deep.equal(createFixtures.expect);
      });
    });


  });

});
