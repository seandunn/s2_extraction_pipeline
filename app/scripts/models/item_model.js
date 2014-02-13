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