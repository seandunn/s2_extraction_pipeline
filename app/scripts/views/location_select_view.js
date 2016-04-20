//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([
  "text!html_partials/_input.html"
], function(InputPartial) {

  var LocationSelectView;

  LocationSelectView = function(args) {
    var options = args["locationSelect"];

    this.collection = options["collection"] || [];
    this.template   = _.compose($, _.template(InputPartial));

    return this;
  }

  LocationSelectView.prototype.render = function() {
    return this.template({
      label: "Select Location",
      id:    "locationSelect",
      options: this._formatOptions()
    });
  }

  LocationSelectView.prototype._formatOptions = function(options) {
    return _.map(this.collection, this._formatOption);
  }

  LocationSelectView.prototype._formatOption = function(item) {
    return {
      value: item.uuid,
      text:  item.name
    }
  }

  return LocationSelectView;
});
