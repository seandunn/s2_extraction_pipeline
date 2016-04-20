//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([ "app-components/labelling/scanning", "lib/pubsub",
    "lib/jquery_extensions"
], function(labwareScanner, PubSub) {
  "use strict";
  /* Listens */
  var SCANNED_BARCODE = "scanned.barcode.s2";
  /* Triggers */
  var BED_SCANNED = "scanned.bed.s2";
  var DONE = "done.s2";
  
  return function(context) {
    var obj = labwareScanner(
      { label : "Scan bed barcode"
      });
    
    var validation = context.bedValidation || _.identity;
    
    obj.view.on(SCANNED_BARCODE, $.ignoresEvent(function(barcode) {
      validation(barcode).then(function() {
        obj.view.trigger(BED_SCANNED, barcode);
        obj.view.trigger(DONE, obj.view, barcode);
      }).fail(function(msg) {
        $('input', obj.view).val('');
        PubSub.publish("error.status.s2", undefined, {message: msg});
      });
      return true;
    }));
    return obj;
  };
});
