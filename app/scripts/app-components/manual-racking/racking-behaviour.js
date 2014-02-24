define([
  "app-components/component"
], function(Component) {

  function RackingBehaviour(args) {
    this.labware   = args.labware;
    this.aliquotType = args.aliquotType;
    this.numberOfRows = args.rows || 8;
    this.numberOfColumns = args.columns || 12;
    this.locations = createLocations(this.numberOfRows, this.numberOfColumns);

    Component.apply(this, []);

    return this;
  }

  _.extend(RackingBehaviour.prototype, Component.prototype);

  RackingBehaviour.prototype.addTube = function(tube, location) {
    if (!this._isValidLocation(location)) return false;
    _.findWhere(this.tubes, {location: location}).tube = tube;
    this.trigger("change");
    return true;
  }

  RackingBehaviour.prototype.setBarcode = function(barcode) {
    this.barcode = barcode;
    var $tSpan = this.labware.view.find("svg .barcode tspan");
    var bcText = $tSpan.text();
    $tSpan.text(bcText + " " + this.barcode);
  }

  RackingBehaviour.prototype.setResource = function(resource) {
    this.resource = resource;
  }

  RackingBehaviour.prototype.nextLocation = function() {
    var nextIndex = _.indexOf(this.locations, this.currentLocation) + 1;
    if (nextIndex >= this.locations.length) return false;
    this.currentLocation = this.locations[nextIndex];
    return nextIndex;
  }

  RackingBehaviour.prototype.empty = function() {
    this._afterInit();
    this.trigger("change");
  }

  RackingBehaviour.prototype.highlightRackSlot = function(location) {
    if (!this._isValidLocation(location)) return false;
    this._showTube(location, "green");
  }

  RackingBehaviour.prototype.save = function(outputRole) {
    return this.resource.update(this._serialize())
      .then(_.bind(this._updateAllTubeOrders, this, outputRole));
  }

  // Private

  RackingBehaviour.prototype._updateAllTubeOrders = function(outputRole) {
      return this._getOrders()
        .then(_.bind(this._updateOrders, this, outputRole, "start"))
        .then(_.bind(this._updateOrders, this, outputRole, "complete"))
  }

  RackingBehaviour.prototype._getOrders = function() {
    return $.when.apply(null, _.invoke(this._getNonEmptyTubes(), "order"))
      .then(function() {
        var ordersByUUID = _.groupBy(arguments, _.field("uuid"));
        return _.map(ordersByUUID, _.first);
      });
  }

  RackingBehaviour.prototype._updateOrders = function(outputRole, event, orders) {
    return $.when.apply(null, _.invoke(orders, "update", this._buildOrderUpdate(outputRole, event)))
      .then(function() {
        return orders;
      })
  }

  RackingBehaviour.prototype._buildOrderUpdate = function(outputRole, event) {
    var updateJson                             = { items: {} };
    updateJson.items[outputRole]               = {};
    updateJson.items[outputRole][this.resource.uuid] = { event: event };
    return updateJson;
  }

  RackingBehaviour.prototype._serialize = function() {
    return {
      aliquot_type: this.aliquotType,
      tubes: this._serializeTubes()
    }
  }

  RackingBehaviour.prototype._serializeTubes = function() {
    return _.chain(this.tubes)
      .filter(this._nonEmptyLocation)
      .reduce(this._locationTubeUUIDPair, {})
      .value();
  }

  RackingBehaviour.prototype._nonEmptyLocation = function(tube) {
    return !_.isEmpty(tube.tube);
  }

  RackingBehaviour.prototype._getNonEmptyTubes = function() {
    return _.pluck(_.filter(this.tubes, this._nonEmptyLocation), "tube");
  }

  RackingBehaviour.prototype._locationTubeUUIDPair = function(memo, tube) {
    memo[tube.location] = tube.tube.uuid;
    return memo;
  }

  RackingBehaviour.prototype._afterInit = function() {
    this.tubes           = createTubes(this.locations);
    this.currentLocation = _.first(this.locations);
  } 

  RackingBehaviour.prototype._setupListeners = function() {
    this.on("change", _.bind(this._updateView, this));
  }

  RackingBehaviour.prototype._updateView = function() {
    _.each(this.tubes, function(tube) {
      var colour = (this._nonEmptyLocation(tube)) ? "red" : "#26211d";
      this._showTube(tube.location, colour);
    }, this);
  }

  RackingBehaviour.prototype._showTube = function(location, colour) {
    colour = colour || "red";
    this.labware.view.find("svg ." + location).css("fill", colour);
  }

  RackingBehaviour.prototype._isValidLocation = function(location) {
    return _.contains(this.locations, location);
  }

  // Transforms rows and columns into locations on a rack
  // e.g. createLocations(2, 3) =>
  // [A1, B1, C1, A2, B2, C2]
  // Shut up, it works!!
  function createLocations(rows, columns) {
    var locations = [],
        A         = "A".charCodeAt(0);

    _.times(columns, function(i) {
      _.times(rows, function(j) {
        locations.push(String.fromCharCode(A + j) + (i + 1));
      });
    });

    return locations;
  }

  function createTubes(locations) {
    return _.reduce(locations, function(memo, location) {
      memo.push({
        location: location,
        tube:     {}
      });
      return memo;
    }, []);
  }

  return RackingBehaviour;
});