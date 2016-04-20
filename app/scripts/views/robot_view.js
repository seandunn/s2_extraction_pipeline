//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([], function() {
  function RobotView() {}
  _.extend(RobotView.prototype, {
    toggleInput: function(value) {
      $(".robot input").prop("disabled", value).focus();
    }
  });
  return RobotView;
});
