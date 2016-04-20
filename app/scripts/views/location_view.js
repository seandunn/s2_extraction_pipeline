//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([
  "views/resource_table_view",
  "views/location_select_view"
], function(ResourceTableView, LocationSelectView) {

  var LocationView,
      subViews = _.toArray(arguments);

  function renderSubView(subView) {
    return new subView(this.viewOptions).render();
  }

  function appendSubView(subView) {
    this.$el.append(subView);
  }

  LocationView = function(args) {
    this.owner       = args["owner"]; 
    this.viewOptions = args["viewOptions"];
    this.subViews    = subViews;
    this.$el         = $("<div>");

    return this;
  }

  LocationView.prototype.render = function() {
    _.chain(this.subViews)
      .map(_.bind(renderSubView, this))
      .each(_.bind(appendSubView, this));

    this._setupEvents()
    
    return this.$el;
  }

  LocationView.prototype._setupEvents = function() {
    this.$el.find("select").on("change", _.bind(this._notifyChange, this));
  }

  LocationView.prototype._notifyChange = function(e) {
    this.owner.onChange($(e.currentTarget).val());
  }

  return LocationView;
});
