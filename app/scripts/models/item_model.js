//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([
  "models/base_page_model"
], function(BaseModel) {

  var ItemModel = function(args) {

    var item = args["item"];

    this.owner = args["owner"];

    this.batch  = item["batch"];
    this.role   = item["role"];
    this.status = item["status"];
    this.uuid   = item["uuid"];

    this.initialiseCaching();
  }

  _.extend(ItemModel.prototype, BaseModel);

  return ItemModel;
});
