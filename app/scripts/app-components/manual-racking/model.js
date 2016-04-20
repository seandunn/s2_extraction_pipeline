//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([
  "models/base_page_model"
], function(BaseModel) {

  var ManualRackingModel = Object.create(BaseModel);

  _.extend(ManualRackingModel, {
    init: function(owner) {
      this.owner = owner;
      this.initialiseCaching();
      return this;
    },

    // Proxying method as I hate its name
    fetchByBarcode: function(barcode, labware) {
      return this.cache.fetchResourcePromiseFromBarcode(barcode, labware)
    }
  })

  return ManualRackingModel;
})
