define([ "app-components/linear-process/linear-process",
    "app-components/scanning/bed-recording", "lib/pubsub"
], function(linearProcess, bedRecording, PubSub) {
  "use strict";

  var robotScannedPromise = $.Deferred();
  
  return function(context) {
    
    /**
     * This object contains all the checks that will be performed on a labware when it has been scanned
     * before accepting it as a correct input.
     */
    var Validations = {
      isInCurrentBatch: {
        checkMethod: function(labwareInputModel, position, labware) {
          labwareInputModel = labwareInputModel["labware"+(position+1)];
          var validLabwareBarcodesList = _.map(labwareInputModel.allInputs, function(input) {
            return input.labels.barcode.value;
          });
          return ((position!==0) || (_.indexOf(validLabwareBarcodesList, labware.labels.barcode.value) >= 0));
        },
        errorMessage: function(labwareInputModel, position, labware) {
          return "The scanned labware was not included in the current batch, so it cannot be used as input.";
        }
      },
      isCorrectLabwareType: {
        checkMethod: function(labwareInputModel, position, labware) {
          labwareInputModel = labwareInputModel["labware"+(position+1)];
          return (labware.resourceType === labwareInputModel.expected_type);
        },
        errorMessage: function(labwareInputModel, position, labware) {
          return ["Expected a '", 
                  labwareInputModel.expected_type, 
                  "' barcode but scanned a '",
                  labware.resourceType,
       "' instead"].join('');
        }
      }
    };
        
    function labwareValidation(/* fixed */ validations, labwareInputModel, position, labware) {
      var defer = new $.Deferred();
      var validationWithError = _.find(validations, function(validation) {
        return (!validation.checkMethod(labwareInputModel, position, labware));
      });
      if (_.isUndefined(validationWithError)) {
        defer.resolve(labware);
      } else {
        defer.reject(validationWithError.errorMessage(labwareInputModel, position, labware));
      }
      return defer;
    }
    
    /*function labwareValidation(labwareInputModel, position, labware) {
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
    }*/
    
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

    if (_.isUndefined(context)) {
      context = {};
    }
    
    context.labwareValidations = [Validations.isInCurrentBatch, 
                                  Validations.isCorrectLabwareType].concat(context.labwareValidations || []);
    context.plateValidations = context.plateValidations || _.chain(context.model).keys().sort().map(function(key, pos) {
      return _.partial(labwareValidation, context.labwareValidations, context.model, pos);
    }).value();
    context.bedValidations = context.bedValidations || _.map(_.keys(context.model), function(key) {
      return bedValidation;
    });
    context.maxBeds = context.maxBeds || context.plateValidations.length || 2;
    
    function buildBedRecordingList(context) {
      var list=[];
    
      for (var i=0; (i<context.maxBeds); i++) {
        list.push({ 
          constructor: _.partial(bedRecording, _.extend({
            cssClass: ((i%2)===0)?"left":"right", 
            position: i,
            model: (context.model && context.model["labware" + (i + 1)]) || null,
            notMessage: true,
            recordingValidation: function() {return arguments;},
            bedValidation: context.bedValidations[i],
            plateValidation: (context.plateValidations && context.plateValidations[i]) || _.identity
          }, context))
        });
      }
      return list;
    }
    
    var componentsList = buildBedRecordingList(context);
    var obj = linearProcess({
      components: componentsList
    });

    $("input", obj.view).prop("disabled", "true");

    var bedVerificationPromises =
    _.map(obj.components, function(component) {
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
      return _.pluck(obj.components, "toObj");
    };
    
    obj.fromObj = function(data) {
      _.map(_.zip(data,obj.components), function(pair) {
        return pair[0].fromObj(pair[1]);
      });
    };
    
    return obj;
  };
});