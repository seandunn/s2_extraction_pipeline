define([ "text!app-components/scanning/_bed-recording.html",
         "app-components/linear-process/linear-process",
         "app-components/scanning/bed",
         "app-components/scanning/plate",
    "lib/jquery_extensions"
], function(bedRecordingTemplate, linearProcess, bed, plate) {
  "use strict";
  /* Listens down */
  var PLATE_SCANNED = "scanned.plate.s2";
  var BED_SCANNED = "scanned.bed.s2";
  /* Listen up */
  var BED_RECORDING_RESET = "reset.bed-recording.s2";
  var ROBOT_SCANNED = "scanned.robot.s2";
  /* Triggers up */
  var BED_RECORDING_DONE = "scanned.bed-recording.s2";
  var DONE = "done.s2";
  var robotScannedPromise = $.Deferred();

  return function(context) {
    var html = $(_.template(bedRecordingTemplate)());
    var component = linearProcess(
      { components : [
        { constructor : _.partial(bed, context),
        },
        { constructor : _.partial(plate, context)
        }
      ]
      });
    html.append(component.view);

    $("input", html).prop("disabled", "true");
    
    var promisesBedRecordingDone = ([robotScannedPromise]).concat(_.chain([ BED_SCANNED, PLATE_SCANNED
    ]).map(_.partial(function(view, eventName) {
      var deferred = $.Deferred();
      view.on(eventName, _.partial(function(deferred, event, data) {
        deferred.resolve(data);
      }, deferred));
      return deferred;
    }, html)).value());

    
    function validation(robotBarcode, bed, plate) {
      var bedRecords = [{
        robot: robotBarcode,
        bed: bed,
        plate: plate
      }];
      var robot = _.find(context.bedsConfig, function(robot) {
        return robot.barcode === robotBarcode;
      });
      
      var defer = new $.Deferred();
      if (_.some(robot.beds, function(bedPair) {
        return (bedPair[0].barcode === bed); 
      })) {
        defer.resolve({
          robot: robot,
          verified: bedRecords
        });
      }
      else {
        defer.reject();
      }
      return defer;
    }
        
    $.when.apply(this, promisesBedRecordingDone).then(context.recordingValidation || validation).then(
      function() {
        html.trigger("scanned.bed-recording.s2", arguments);
        html.trigger(DONE, html);
      }, _.partial(function(component) {
        component.components[1].view.trigger("reset.s2");
      }, component));
    
    if (context.cssClass) {
      html.addClass(context.cssClass);
    }

    $(document.body).on("scanned.robot.s2", _.partial(function(promise, event, robot) {
      promise.resolve(robot);
    }, robotScannedPromise));

    return (
      { view : html,
        events : component.events
      });
  };
});