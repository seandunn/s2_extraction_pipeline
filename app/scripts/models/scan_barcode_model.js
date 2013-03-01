define(['extraction_pipeline/dummyresource'], function(DummyResource) {
  'use strict';

  var ScanBarcodeModel = function (type) {
    /* Constructor
     *
     * Arguments
     * ---------
     * type: the type of barcode to expect. Current accepted
     *       values for this are:
     *         - tube ( a tube barcode )
     */
    this.type = type;
    this.customError = "";
    this.busy = false;
    this.barcode = "";
  };

  ScanBarcodeModel.prototype.isValid = function () {
    /* Determines whether the barcode is a valid barcode 
     *
     * Returns
     * -------
     * true, if the barcode is a well-formed barcode for the
     *       configured barcode type
     * false, otherwise
     */
    if (this.barcode.length === 0) {
      return true;
    }
    if (this.type === "tube") {
      return this.isValidTubeBarcode();
    }
    return false;
  };

  ScanBarcodeModel.prototype.isValidTubeBarcode = function () {
    /* Determines whether the barcode is a valid tube barcode 
     *
     * Returns
     * -------
     * true, if the barcode is a well-formed tube barcode
     * false, otherwise
     */
    // TODO : this is a placeholder
    // Tube pattern expected to be tubeXXXX where XXXX is an integer
    var patt = /tube[0-9]{4}/g;
    return patt.test(this.barcode);
  };

  ScanBarcodeModel.prototype.getResourceFromBarcode = function () {
    /* Attempts to lookup a resource from the given barcode
     *
     * Returns
     * -------
     * - The resource corresponding to the barcode, if one can
     *   be determined.
     * - undefined otherwise
     */
    if (this.type === "tube") {
      return this.getResourceFromTubeBarcode();
    }
  };

  ScanBarcodeModel.prototype.getResourceFromTubeBarcode = function () {
    var tubePath = 'components/s2-api-examples/tube.json';
    return new DummyResource(tubePath, "read");
  };

  return ScanBarcodeModel;
});
