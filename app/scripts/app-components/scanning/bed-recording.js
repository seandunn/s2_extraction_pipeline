define([ "text!app-components/scanning/_bed-recording.html",
         "app-components/linear-process/linear-process",
         "app-components/scanning/bed",
         "app-components/scanning/plate",
         "lib/pubsub",
    "lib/jquery_extensions"
], function(bedRecordingTemplate, linearProcess, bed, plate, PubSub) {
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

  $(document.body).on("scanned.robot.s2", _.partial(function(promise, event, robot) {
    promise.resolve(robot);
  }, robotScannedPromise));
  
  
  return function(context) {
    var html = $(_.template(bedRecordingTemplate)());
    var labResource = context.model["labware"+(context.position+1)];
    
    function bedValidation(barcode) {        
      var defer = $.Deferred();
      robotScannedPromise.then(function(robot) {
        if (robot.isValidBedBarcode(barcode)) {
          defer.resolve(barcode);
        } else {
          defer.reject("Incorrect bed barcode");
        }
      });
      return defer;
    }
    
    
    context.bedValidation = context.bedValidation || bedValidation;
    var component = linearProcess(
      { components : [
        { constructor : _.partial(bed, context),
        },
        { constructor : _.partial(plate, _.extend(context, {
          labware:    labResource.resource || labResource
          }))
        }
      ]
      });
    html.append(component.view);

    $("input", html).prop("disabled", "true");
    
    var promisesBedRecordingDone = ([robotScannedPromise]).concat([$.Deferred(), $.Deferred()]);
    
    

    
    html.on(BED_SCANNED, _.partial(function(promise, event, bedBarcode) {
      robotScannedPromise.then(function(robot) {
        if (robot.isValidBedBarcode(bedBarcode, context.position)) {
          promise.resolve(bedBarcode);
        } else {
          promise.reject("This bed should not be in this place.");
        }
      });
    }, promisesBedRecordingDone[1]));
    
    function labwareValidation(labwareInputModel, position, labware) {
      var defer = $.Deferred();
      var validLabwareBarcodesList = _.map(labwareInputModel.allInputs, function(input) {
        return input.labels.barcode.value;
        });
      if (labware.resourceType === labwareInputModel.expected_type) {
        if ((position===0) && (_.indexOf(validLabwareBarcodesList, labware.labels.barcode.value) < 0)) {
          defer.reject("The scanned labware was not included in the current batch, so it cannot be used as input.");
        }
        else {
          defer.resolve(labware);
        }
      } else {
        defer.reject(["Expected a '", 
                      labwareInputModel.expected_type, 
                      "' barcode but scanned a '",
                      labware.resourceType,
           "' instead"].join(''));
      }
      return defer;
    }

    html.on(PLATE_SCANNED, _.partial(function(promise, event, labware) {
      robotScannedPromise.then(function(robot) {
        if (robot.hasNotScannedLabwareBarcodeBefore(labware.labels.barcode.value)) {
          labwareValidation(labResource, context.position, labware).then(function() {
            promise.resolve(labware);
          }, function(msg) {
            promise.reject(msg);
          });
        } else {
          promise.reject("This labware has been scanned before.");
        }
      });
    }, promisesBedRecordingDone[2]));
    

    // Default validation: it will check that the bed barcode is defined for the
    // robot selected in its robot config data object.    
    function validation(robot, bed, plate) {
      var bedRecords = [{
        robot: robot.getBarcode(),
        bed: bed,
        plate: plate
      }];      
      var defer = new $.Deferred();
      if (robot.isValidBedBarcode(bed) && robot.hasScannedLabwareBarcodeBefore(plate)) {
        defer.resolve({
          robot: robot,
          verified: bedRecords
        });
      } else {
        defer.reject();
      }
      return defer.promise();
    }
          
    $.when.apply(this, promisesBedRecordingDone).then(context.recordingValidation || validation).then(
      function(args) {
        var robot = args[0], bedBarcode = args[1], labware = args[2];
        robot.markLabwareBarcodeAsUsed(labware.labels.barcode.value);
        robot.markBedBarcodeAsUsed(bedBarcode);
        html.trigger("scanned.bed-recording.s2", arguments);
        html.trigger(DONE, html);
        if (!context.notMessage) {
          PubSub.publish("message.status.s2", this, {message: 'Bed recording correct.'});
        }
      }, function(msg) {
        PubSub.publish("error.status.s2", this, {message: msg});        
        html.trigger("error.bed-recording.s2");
      });
    
    if (context.cssClass) {
      html.addClass(context.cssClass);
    }
    html.addClass("bed-recording");

    var bedObj = component.components[0],
      plateObj = component.components[1];

    // Should be solved
      //if (context.position === 0) {
        //obj.view.trigger(LABWARE_DISPLAY, representer(labware));
      //}
    
    return (
      { view : html,
        events : component.events,
        toObj : function() {
          return [ plateObj.getBarcode(), bedObj.getBarcode()];
        },
        fromObj: function(data) {
          plateObj.setBarcode(data[0]);
          if (data[1]) {
            bedObj.setBarcode(data[1]);
            plateObj.view.trigger("scanned.barcode.s2", data[0]);
          } else {
            if (data[0]) {
              plateObj.renderDisplay(data[0]);
              this.view.addClass("labware-without-bed");
            }
          }
        }
      });
  };
});
