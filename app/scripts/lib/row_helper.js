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