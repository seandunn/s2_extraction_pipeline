define([ "app-components/labelling/scanning", "labware/standard_mappers",
    "lib/jquery_extensions"
], function(labwareScanner) {
  "use strict";
  /* Listens */
  var SCANNED_BARCODE = "scanned.barcode.s2";
  /* Triggers */
  var BED_SCANNED = "scanned.bed.s2";
  var DONE = "done.s2";
  
  return function() {
    var obj = labwareScanner(
      { label : "Scan bed barcode"
      });
    obj.view.on(SCANNED_BARCODE, $.ignoresEvent(function(barcode) {
      obj.view.trigger(BED_SCANNED, barcode);
      obj.view.trigger(DONE, obj.view, barcode);
      return true;
    }));
    return obj;
  };
});