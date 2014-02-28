define([ "app-components/linear-process/linear-process",
    "app-components/scanning/bed-recording", "lib/pubsub"
], function(linearProcess, bedRecording, PubSub) {
  "use strict";

  var robotScannedPromise = $.Deferred();
  
  return function(context) {

    
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
    
    function bedValidation(barcode) {        
      var defer = $.Deferred();
      robotScannedPromise.then(function(robot) {
        var validBedsList = robot.getValidBeds();
        var pos = _.indexOf(validBedsList, barcode);
        if (pos>=0) {
          defer.resolve(barcode);
        } else {
          defer.reject();
          PubSub.publish("error.status.s2", undefined, 
            {message: ["Incorrect bed barcode"].join('')});
        }
      });
      return defer;
    }
    
    context.plateValidations = context.plateValidations || 
        [ _.partial(labwareValidation, context.model.labware1, 0),
          _.partial(labwareValidation, context.model.labware2, 1)];
    
    context.bedValidations = context.bedValidations || [ bedValidation, bedValidation];
    
    
    function buildBedRecording(context, list) {
      return list[list.push(bedRecording(context))-1];
    }
    var componentsList=[];
    var obj = linearProcess({
      components: [{ constructor: _.partial(buildBedRecording, _.extend({
        cssClass: "left", 
        position: 0,
        model: context.model.labware1,
        notMessage: true,
        recordingValidation: function() {return arguments;},
        bedValidation: context.bedValidations[0],
        plateValidation: context.plateValidations[0]
      }, context), componentsList) },
      { constructor: _.partial(buildBedRecording, _.extend({
        cssClass: "right", 
        position: 1, 
        model: context.model.labware2,
        notMessage: true,
        recordingValidation: function() {return arguments;},
        bedValidation: context.bedValidations[1],
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
      var robot = arguments[0]; 
      var bedRecords = _.map(Array.prototype.slice.call(arguments, 1), function(list) {
        var data = list[1];
        return ({
          robot: data[0],
          bed: data[1],
          plate: data[2]
        });
      });
      
      var defer = new $.Deferred();
      
      // All verification has been delegated to bed recording component
      defer.resolve({
        robot: robot,
        verified: bedRecords
      });

      return defer;
    }
    
    obj.view.on("error.bed-recording.s2", function() {
      obj.view.trigger("error.bed-verification.s2");
    });
    
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
    
    obj.toObj = function() {
      return [ obj.components[0].toObj(), obj.components[1].toObj()];
    };
    
    obj.fromObj = function(data) {
      obj.components[0].fromObj(data[0]);
      obj.components[1].fromObj(data[1]);
    };
    
    return obj;
  };
});