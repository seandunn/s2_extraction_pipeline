define([ "text!app-components/bed-recording/_subcomponent.html",
    "app-components/linear-process/linear-process",
    "app-components/labelling/scanning", "app-components/labware/display",
    "labware/standard_mappers", "lib/jquery_extensions"
], function(subComponentView, linearProcess, labwareScanner, labwareDisplay,
  representer) {
  "use strict";
  var SCANNED_BARCODE = "scanned.barcode.s2";
  var LABWARE_DISPLAY = "display.labware.s2";
  var PLATE_SCANNED = "scanned.plate.s2";
  var BED_SCANNED = "scanned.bed.s2";
  var BED_RECORDING_DONE = "done.bed-recording.s2";
  var BED_RECORDING_RESET = "reset.bed-recording.s2";
  var DONE = "done.s2";
  
  var Plate = _.partial(function(subComponentTemplate, context) {
    var rootValue = context;
    var view = subComponentTemplate();
    var labware = labwareDisplay({});
    view.find(".labware").append(labware.view);
    view.on(labware.events);
    var obj = labwareScanner(
      { label : "Scan plate barcode"
      });
    obj.view.append(view);
    obj.view.on(SCANNED_BARCODE, $.ignoresEvent(function(barcode) {
      rootValue.findByLabEan13(barcode).then(function(labware) {
        view.trigger(LABWARE_DISPLAY, representer(labware));
        return labware;
      }).then(function(labware) {
        obj.view.trigger(PLATE_SCANNED, labware);
        obj.view.trigger(DONE, obj.view);
      });
    }));
    return obj;
  }, _.compose($, _.template(subComponentView)));
  function Bed() {
    var obj = labwareScanner(
      { label : "Scan bed barcode"
      });
    obj.view.on(SCANNED_BARCODE, $.ignoresEvent(function(barcode) {
      obj.view.trigger(BED_SCANNED, barcode);
      obj.view.trigger(DONE, obj.view, barcode);
    }));
    return obj;
  }
  return function(context) {
    var html = $("<div tabindex='-1'><span></span></div>");
    var component = linearProcess(
      { components : [
        { constructor : _.partial(Bed, context),
        },
        { constructor : _.partial(Plate, context)
        }
      ]
      });
    html.append(component.view);
    var promisesBedRecordingDone =
    _.chain([ BED_SCANNED, PLATE_SCANNED
    ]).map(_.partial(function(view, eventName) {
      var deferred = $.Deferred();
      view.on(eventName, $.ignoresEvent(function() {
        return deferred.resolve.apply(this, arguments);
      }));
      return deferred;
    }, html)).value();
    $.when.apply(this, promisesBedRecordingDone).then(
      function(plateResource, bedBarcode) {
        html.trigger(BED_RECORDING_DONE, [ html, plateResource, bedBarcode
        ]);
      });
    return (
      { view : html, events : _.extend(
        { BED_RECORDING_RESET : function() {}
        }, component.events)
      });
  };
});