# bed-verification.js
It may contains the following context parameters:
* `robotScannedEvent` is the name of the event (identifier of the DOM message) that this component will listen to
in order to identify the robot that it should use.
* `validation` is the reference to a function that will perform the validation task of all the bed-plate pairs that
participate in the bed verification