define([
  "collections/collection",
  "collections/link",
  "models/location_model"
], function(Collection, Link, LocationModel) {

  var LocationCollection;

  function setCollection(collection) {
    this.collection = collection;
    return this;
  }

  function formatResponse(response) {
    return response.rawJson.locations;
  }

  function createLocations(owner, locations) {
    return _.map(locations, _.partial(createLocation, owner));
  }

  function createLocation(owner, location) {
    return new LocationModel({
      owner:    owner,
      location: location
    });
  }

  function first(deferred, root) {
    var _this = this;
    
    root.locations.first()
      .then(formatResponse)
      .then(_.partial(createLocations, this.owner))
      .then(_.bind(setCollection, this))
      .then(function() {
        return deferred.resolve(_this.collection);
      });
  }

  LocationCollection = function(args) {
    this.owner      = args["owner"];
    this.collection = (args["locations"]) ? createLocations(this.owner, args["location"]) : [];
  }

  LocationCollection.prototype.first = function() {
    var deferred = $.Deferred();

    this.owner.getS2Root().then(_.bind(first, this, deferred));

    return deferred.promise();
  }

  _.extend(LocationCollection.prototype, Collection.prototype);

  Link(LocationCollection);

  return LocationCollection;
});