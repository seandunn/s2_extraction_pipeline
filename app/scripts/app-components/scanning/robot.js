define([ "app-components/labelling/scanning", "lib/pubsub", "config", "lib/jquery_extensions"
], function(labwareScanner, PubSub, AppConfig) {
  "use strict";
  /* Listens */
  var SCANNED_BARCODE = "scanned.barcode.s2";
  /* Triggers */
  var ROBOT_SCANNED = "scanned.robot.s2";
  var DONE = "done.s2";

  // List of robots by group
  var ROBOT_GROUPS =_.reduce(AppConfig.Robots, function(memo, robot) {
    if (_.isUndefined(memo[robot.robotType])) {
      memo[robot.robotType] = [];
    }
    memo[robot.robotType].push(robot.barcode);
    return memo;
  }, {});
  
  return (function(context) {
    var scanner = labwareScanner(
      { label : "Scan robot barcode"
      });
    
    var instance =  _.extend(scanner, {
      // Selects a robot from the list of available robots in the group we have
      // been configured for. It creates a copy of the config that can be modified
      // barcode - robot barcode
      selectRobot: function(robotBarcode) {
        this._defaultRobot = _.find(AppConfig.Robots, function(robot) {
          return robot.barcode === robotBarcode;
        });
        this.resetSelectedRobot();      
      },
      // Resets the content of the selected robot from the config
      resetSelectedRobot: function() {
        this._selectedRobot = _.clone(this._defaultRobot);
        this._selectedRobot.beds = $.extend(true, [], this._defaultRobot.beds);
        this._labwareScannedList = [];
      },
      // For a robot, a labware is valid if it has never been scanned before for this
      // robot
      hasNotScannedLabwareBarcodeBefore: function(labwareBarcode) {
        return (_.indexOf(this._labwareScannedList, labwareBarcode) < 0);
      },
      // Returns true if the bed barcode provided is valid for the selected robot
      // atPosition - position which will be checked in the bed list
      isValidBedBarcode: function(bedBarcode, /* optional */ atPosition) {
        if (!_.isUndefined(atPosition)) {
          // I search for the index of the list of beds that contain my bed
          var posNumber = _.indexOf(_.map(this._selectedRobot.beds, function(line) { 
            if (line[atPosition]===null) {
              return null;
            }
            return line[atPosition].barcode;
          }), bedBarcode);
          // I check that all previously beds were marked as Used before (value null)
          return ((posNumber>=0) && (_.compact(this._selectedRobot.beds[posNumber].slice(0, atPosition)).length===0));
        } else {
          return (_.chain(this._selectedRobot.beds)
          .map(function(node) {
            return _.pluck(_.compact(node), "barcode");
          })
          .flatten()
          .indexOf(bedBarcode)
          .value() >= 0);
        }
      },
      isValidRobotBarcode: function(barcode) {
        return (_.indexOf(ROBOT_GROUPS[this.robotType], barcode) >= 0);
      },
      markLabwareBarcodeAsUsed: function(labwareBarcode) {
        if (this.hasNotScannedLabwareBarcodeBefore(labwareBarcode)) {
          this._labwareScannedList.push(labwareBarcode);
        }
      },
      // Removes the bed barcode from the selected robot. To reset the status
      // again we will need to call reset() again.
      markBedBarcodeAsUsed: function(bed) {
        _.each(this._selectedRobot.beds, function(beds) {
          var pos = _.indexOf(_.map(beds, function(node) { 
            if (node) { 
              return node.barcode
            } else { 
              return  null; 
            }}), bed);
          if (pos >= 0) {
            beds[pos] = null;
          }
        });
        // If there is a list of beds empty, we remove it from list
        _.compact(this._selectedRobot.beds);
      }
    });

    // Performs init for the object (just once)
    function initialize(context) {
      _.extend(this, context);
      
      $("input", this.view).prop("disabled", "true");
      $(this.view).addClass("robot");
      this.view.on(SCANNED_BARCODE, $.ignoresEvent(_.bind(function(barcode) {
        if (this.isValidRobotBarcode(barcode))
        {
          this.selectRobot(barcode);
          this.view.trigger(ROBOT_SCANNED, this);
          this.view.trigger(DONE, this.view);
          PubSub.publish("message.status.s2", this, {message: 'Loaded robot.'});
          $("input", this.view).prop("disabled", "true");
          return true;
        } else {
          $('input', this.view).val('');
          PubSub.publish("error.status.s2", this, {message: 'Incorrect robot barcode.'});
        }
      }, this)));
    }
    
    initialize.call(instance, context);

    return instance;
  });
});