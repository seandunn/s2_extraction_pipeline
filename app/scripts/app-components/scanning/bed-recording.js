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
    
    var promisesBedRecordingDone = _.chain([ BED_SCANNED, PLATE_SCANNED
    ]).map(_.partial(function(view, eventName) {
      var deferred = $.Deferred();
      view.on(eventName, _.partial(function(deferred) {
        deferred.resolve(arguments);
      }, deferred));
      return deferred;
    }, html)).value().concat(robotScannedPromise);
    
   
    
    $.when.apply(undefined, promisesBedRecordingDone).then(
      function(bedBarcode, plateResource, robotResource) {
        html.trigger("scanned.bed-recording.s2", [ html, bedBarcode, plateResource 
        ]);
        html.trigger(DONE, html);
      });
    if (context.cssClass) {
      html.addClass(context.cssClass);
    }

    $(document.body).on("scanned.robot.s2", _.partial(function(promise, event, robot) {
      promise.resolve(robot);
    }, robotScannedPromise));

    return (
      { view : html, events : _.extend(
        {  "reset.bed-recording.s2": function() {}           
        }, component.events)
      });
  };
});