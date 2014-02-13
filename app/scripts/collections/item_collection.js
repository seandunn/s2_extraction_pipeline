define([
  "collections/collection",
  "collections/link",
  "models/item_model"
], function(Collection, Link, ItemModel) {

  var ItemCollection;

  function createItems(owner, items) {
    return _.map(items, _.partial(createItem, owner));
  }

  function createItem(owner, item) {
    return new ItemModel({
      owner: owner,
      item: item
    });
  }

  ItemCollection = function(args) {
    this.owner       = args["owner"];
    this.collection = createItems(this.owner, args["items"]);
  }
  
  ItemCollection.prototype.getUUIDs = function() {
    return _.pluck(this.collection, "uuid");
  }

  ItemCollection.prototype.filterByRole = function(role) {
    return _.where(this.collection, { role: role });
  }

  ItemCollection.prototype.filterByStatus = function(status) {
    return _.where(this.collection, { status: status });
  }

  _.extend(ItemCollection.prototype, Collection.prototype);

  Link(ItemCollection);

  return ItemCollection;
});