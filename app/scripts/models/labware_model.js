//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([
  "labware/presenter",
  "event_emitter"
], function(LabwarePresenter, EventEmitter) {

  var LabwareModel = new EventEmitter();

  _.extend(LabwareModel, LabwarePresenter, {
    init: function (owner, setupData) {
      this.owner = owner;
      $.extend(this, setupData);

      return this;
    },
    setResource: function(resource, presenter) {
      this.presentResource = presenter;
      this.resource        = resource;
      this.emit("resourceUpdated");
    },
    displayResource: function(resourceSelector) {
      var resourceController = this.owner.resourceController,
          resource           = this.resource;

      resourceController.setupController(this.presentResource(resource), resourceSelector);
    },

    displayLabware: function() {
      return this.display_labware === undefined ? true : this.display_labware;
    }
  });

  return LabwareModel;
});
