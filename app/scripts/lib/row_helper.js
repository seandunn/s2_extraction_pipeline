//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define(function() {
  "use strict";

  var RowHelper = Object.create(null);

  RowHelper.nearestRow = function(event) {
    return $(event.target).closest("tr");
  };

  RowHelper.disableRow = function($tr) {
    $tr.find("select,input").attr("disabled", true);
    $tr.removeClass("success");
    return $tr;
  };

  RowHelper.enableRow = function($tr) {
    $tr.find("select,input").attr("disabled", false);
    $tr.addClass("success");
    return $tr;
  };

  RowHelper.enableRowSelector = function($tr) {
    $tr.find("input[data-name_of_column='_SELECTED']").attr("disabled", false);
  };

  return RowHelper;
});
