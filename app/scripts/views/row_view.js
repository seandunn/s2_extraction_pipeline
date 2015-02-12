//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define(['text!html_partials/_row.html'], function (rowPartialHtml) {

  'use strict';

  function getKey(e) {
    if (window.event) {
      return window.event.keyCode;
    }
    else if (e) {
      return e.which;
    }
    return null;
  }

  var RowView = function (owner, jquerySelector) {
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  RowView.prototype.renderView = function (model) {
    this.jquerySelector.empty().append(rowPartialHtml);
  };

  RowView.prototype.clear = function () {
    var children = this.jquerySelector.empty();
  };

  return RowView;

});

