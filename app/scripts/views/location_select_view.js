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