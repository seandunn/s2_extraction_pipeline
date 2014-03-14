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