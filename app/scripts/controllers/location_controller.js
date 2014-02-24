define([
  "controllers/base_controller",
  "collections/location_collection",
  "collections/item_collection",
  "models/location_model",
  "views/location_view",
  "lib/pubsub",
  "mapper/operations",
  "lib/underscore_extensions"
], function(BaseController, LocationCollection, ItemCollection, LocationModel, LocationView, PubSub, Operations) {
    
  var LocationController = function(owner) {
    this.owner              = owner;
    this.config             = owner.config;
    this.locationCollection = new LocationCollection({owner: this.owner});
    this.locationModel      = new LocationModel({owner: this.owner});
    this.selectedLocation   = null;
    var a = "change";
    this._setRole();
  }

  LocationController.prototype.addListeners = _.ignore;
    
  LocationController.prototype.setupController = function(args, selector) {
    this.user     = args["user"];
    this.batch    = args["batch"];
    this.selector = selector;
  }

  LocationController.prototype.initialController = function() {

    var _this    = this,
        promises = [this.locationCollection.first(), this._getBatchResources()];

    // Fetch the items in the batch, and a list of the locations
    $.when.apply(null, promises)
      .then(function(locations, itemResources) {
        _this.itemResources = itemResources;
        _this.locations     = locations;

        _this._createView(itemResources, locations);
        _this._renderView();
      });
  }

  LocationController.prototype.focus = function() {}

  LocationController.prototype.ship = function() {
    var _this = this;

    this.locationModel.update(this.selectedLocation, { 
      labware_uuids: _.pluck(this.itemResources, "uuid")
    })
      .then(function() {
        PubSub.publish("success.status.s2", _this, {
          message: "The location of the samples has been updated"
        });
        _this._enableBtn("next");
      }, function() {
        PubSub.publish("error.status.s2", _this, {
          message: "The location of the sample could not be updated"
        });
      });
  }

  LocationController.prototype.next = function() {
    var _this = this;

    $.when.apply(null, _.map(this.itemResources, _.partial(changeRole, this.config)))
      .then(function() {
        _this._callChildDone("done", { batch: _this.batch, user: _this.user });
      }, function() {
        PubSub.publish("error.status.s2", _this, {
          message: "The batch could not be updated. Please contact the system administrator."
        });
      });
  }

  LocationController.prototype._setRole = function() {
    this.role = _.first(this.config.accepts);
  }

  LocationController.prototype.onChange = function(optionValue) {
    if (optionValue) {
      this.selectedLocation = optionValue;
      this._enableBtn("ship");
    } else {
      this._disableBtn("ship");
    }
  }

  LocationController.prototype._enableBtn = function(btnAction) {
    this.owner.enableBtn(btnAction);
  }

  LocationController.prototype._disableBtn = function(btnAction) {
    this.owner.disableBtn(btnAction)
  }

  LocationController.prototype._callChildDone = function(action, data) {
    // Quarantine the disease....... urgh
    this.owner.childDone(this, action, data);
  }

  LocationController.prototype._createView = function(itemResources, locations) {
    this.view = new LocationView({
      owner         : this,
      viewOptions: {
        resourceTable : { rowInformation: itemResources },
        locationSelect: { collection: locations }
      }
    });
  }

  LocationController.prototype._renderView = function() {
    this.selector().append(this.view.render());
  }

  LocationController.prototype._getBatchResources = function() {
    return this.batch.items
      .then(_.partial(createItemCollection, this.owner))
      .then(_.bind(this._getItemResources, this));
  }

  LocationController.prototype._getItemResources = function(items) {
    return items.chain()
            .filterByRole(this.role)
            .filterByStatus("done")
            .fetchResources()
            .value();
  }

  function changeRole(config, resource) {
    return resource.order().then(function(order) {
      return {
        input: {
          order: order,
          resource: resource,
          role: _.first(config.accepts)
        },
        output: {
          order: order,
          resource: resource,
          role: _.first(config.controllers).output[0].role
        }
      }
    })
    .then(function(options) {
      return Operations.stateManagement().start({ updates: [options] }).then(function() {
        return Operations.stateManagement().complete({ updates: [options]});
      });
    });
  }

  function createItemCollection(owner, items) {
    return new ItemCollection({
      owner: owner, 
      items: items
    });
  }

  _.extend(LocationController.prototype, BaseController.prototype);

  return {
    register: function(callback) {
      callback("location_controller", function(owner, factory) {
        return new LocationController(owner, factory);
      });
    }
  };
});