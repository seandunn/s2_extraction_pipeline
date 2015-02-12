//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define(function() {
  "use strict";

  function templateHelper(callback) {
    return function(cell) {
      var value   = cell.value || cell.default;
      var element = callback(cell, value);
      return element.addClass(cell.class)
                    .attr("data-name_of_column", cell.columnName);
    };
  }

  var CellTemplates = Object.create(null);

  _.extend(CellTemplates, {
    select: function(cell, value) {

      function option(opt) {
        var details = {value: opt.trim(), text: opt.trim()};
        if (details.value.toUpperCase() === value.trim().toUpperCase()) {
          details.selected = "selected";
        }
        return $("<option></option>", details);
      }

      return $("<select/>").append(_.map(cell.options, option));
    },

    checkbox: function(cell, value) {
      var checkbox = $("<input type='checkbox' />");
      if (value) {
        checkbox.attr("checked", "checked");
      }
      return checkbox;
    },

    span: function(cell, value) {
      return $("<span />").text(value);
    },

    boolean: function(cell, value) {
      return $("<span />").text(value ? "Yes" : "No");
    }
  });

  CellTemplates = _.reduce(CellTemplates, function(memo, fn, name) {
    memo[name] = templateHelper(fn);
    return memo;
  }, {});

  return CellTemplates;
});
