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