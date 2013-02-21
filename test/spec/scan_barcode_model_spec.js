define(['models/scan_barcode_model'], function(ScanBarcodeModel) {
  'use strict';

  describe("ScanBarcodeModel", function() {
    describe("tube barcodes", function() {

      var model;

      beforeEach(function() {
	model = new ScanBarcodeModel("tube");
      });

      it("empty barcode is valid", function() {
	expect(model.isValid()).toBeTruthy();
      });

      it("too short non-blank barcode is invalid", function() {
	model.barcode = "a";
	expect(model.isValid()).toBeFalsy();
      });

      it("too long non-blank barcode is invalid", function() {
	model.barcode = "lakjsdflksejrslekrjslkfj";
	expect(model.isValid()).toBeFalsy();
      });

      it("right lenght but badly formed barcode is invalid", function() {
	model.barcode = "0001kcar";
	expect(model.isValid()).toBeFalsy();
      });

      it("well-formed non-tube barcode is invalid", function() {
	model.barcode = "rack0001";
	expect(model.isValid()).toBeFalsy();
      });

      it("well formed tube barcode is valid", function() {
	model.barcode = "tube0001";
	expect(model.isValid()).toBeTruthy();
      });
    });
  });
});
