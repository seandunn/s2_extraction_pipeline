define([], function() {
  function RobotView() {}
  _.extend(RobotView.prototype, {
    toggleInput: function(value) {
      $(".robot input").prop("disabled", value).focus();
    }
  });
  return RobotView;
});