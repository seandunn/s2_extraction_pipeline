define([ "app-components/labelling/scanning", "lib/pubsub", "lib/jquery_extensions"
], function(labwareScanner, PubSub) {
  "use strict";
  /* Listens */
  var SCANNED_BARCODE = "scanned.barcode.s2";
  /* Triggers */
  var ROBOT_SCANNED = "scanned.robot.s2";
  var DONE = "done.s2";
  function findRobotByBarcode(barcode) {
    return $.get('/config/robots/gel-fx/' + barcode + '.json');
  }
  return (function(context) {
    var scanner = labwareScanner(
      { label : "Scan robot barcode"
      });
    $("input", scanner.view).prop("disabled", "true");
    $(scanner.view).addClass("robot");
    scanner.view.on(SCANNED_BARCODE, $.ignoresEvent(function(barcode) {
      findRobotByBarcode(barcode).then(function(robot) {
        scanner.view.trigger(ROBOT_SCANNED, robot);
        scanner.view.trigger(DONE, scanner.view);
        PubSub.publish("message.status.s2", this, {message: 'Loaded robot.'});
        return true;
      }, function() {
        PubSub.publish("error.status.s2", this, {message: 'Incorrect robot barcode.'});
      });
    }));
    return scanner;
  });
});