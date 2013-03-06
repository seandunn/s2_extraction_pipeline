define(['extraction_pipeline/dummyresource'], function(DummyResource) {
  'use strict';

  var ScanBarcodeModel = function (data) {
    /* Constructor
     *
     * Arguments
     * ---------
     * type: the type of barcode to expect. Current accepted
     *       values for this are:
     *         - tube ( a tube barcode )
     */
    var type =data.type;
    console.log(type);
    this.type = type;
    this.customError = "";
    this.busy = false;
    this.barcode = data.value;
  };

  ScanBarcodeModel.prototype.isValid = function () {
//    var pattern = new RegExp(this.type + "[0-9]{4}","g");
//    return pattern.test(this.barcode);
    return true;
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
    //todo : should be 'type' agnostic at this point : the mapper should decide
    if (this.type === "tube") {
      return new DummyResource('components/s2-api-examples/tube.json', "read");
    }

    return undefined;
  };

  return ScanBarcodeModel;
});
