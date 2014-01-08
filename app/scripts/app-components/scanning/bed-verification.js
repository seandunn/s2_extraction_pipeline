define([ "app-components/linear-process/linear-process",
    "app-components/scanning/bed-recording", "lib/pubsub"
], function(linearProcess, bedRecording, PubSub) {
  "use strict";

  var robotScannedPromise = $.Deferred();
  
  return function(context) {

    function buildBedRecording(context, list) {
      return list[list.push(bedRecording(context))-1];
    }
    var componentsList=[];
    var obj = linearProcess({
      components: [{ constructor: _.partial(buildBedRecording, _.extend({
        cssClass: "left", 
        position: 0, 
        recordingValidation: function() {return arguments;},
        plateValidation: context.plateValidations[0]
      }, context), componentsList) },
      { constructor: _.partial(buildBedRecording, _.extend({
        cssClass: "right", 
        position: 1, 
        recordingValidation: function() {return arguments;},
        plateValidation: context.plateValidations[1]
      }, context), componentsList) } ]
    });

    $("input", obj.view).prop("disabled", "true");

    var bedVerificationPromises =
    _.map(componentsList, function(component) {
      var promise = $.Deferred();
      component.view.on("scanned.bed-recording.s2", function(robot, bedBarcode,
        plateResource) {
        promise.resolve(arguments);
      });
      return promise;
    });

    function validation() {
      var robotBarcode = arguments[0]; 
      var bedRecords = _.map(Array.prototype.slice.call(arguments, 1), function(list) {
        var data = list[1];
        return ({
          robot: data[0],
          bed: data[1],
          plate: data[2]
        });
      });
      
      var robot = _.find(context.bedsConfig, function(robot) {
        return robot.barcode === robotBarcode;
      });
      
      var defer = new $.Deferred();
      if (_.some(robot.beds, function(bedPair) {
        return (bedPair[0].barcode === bedRecords[0].bed && bedPair[1].barcode === bedRecords[1].bed); 
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
    
    $.when.apply(undefined, [ robotScannedPromise
    ].concat(bedVerificationPromises)).then(context.validation || validation).then(
      function() {
        obj.view.trigger("scanned.bed-verification.s2", arguments);
        PubSub.publish("message.status.s2", this, {message: 'Bed verification correct.'});
      }, function() {
        PubSub.publish("error.status.s2", this, {message: 'Incorrect bed verification.'});
        obj.view.trigger("error.bed-verification.s2");
      });
    
    $(document.body).on(context.robotScannedEvent || "scanned.robot.s2", _.partial(function(promise, event, robot) {
      promise.resolve(robot);
    }, robotScannedPromise));
    
    return obj;
  };
});