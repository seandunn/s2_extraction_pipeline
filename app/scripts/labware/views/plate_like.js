define([], function() {
  'use strict';

  var instanceMethods = {
    renderView: function() {
      this.release();

      var container = this.container();
      var labware   = this.labware();

      container.append(document.importNode(this.imageElement(labware), true));

      // Display the information related to the individual locations
      _.each(labware.locations, function(value, location) {
        container.find("svg ." + location).attr("class", cssForType(value));
      });

      // Display any extraneous data
      _.chain(labware)
       .omit(["resourceType", "locations"])
       .each(displayValueIfSet)
       .value();

      return this;

      function displayValueIfSet(value, field) {
        var element = container.find("svg ." + field);
        if (_.isUndefined(value)) {
          element.hide();
        } else {
          element.show().find(".value").text(value);
        }
      }

      function cssForType(type) {
        return _.isUndefined(type) ? "empty" : type.replace(/[^\w-]+/g, '_').toLowerCase();
      }
    },

    release: function() {
      this.container().find("svg").remove();
    }
  };

  return {
    extend: function(implementation) {
      var View = function(owner, selection) {
        this.owner = owner;
        this.container = selection;
        this.model = undefined;
        return this;
      };
      _.extend(View.prototype, instanceMethods, implementation);
      return View;
    }
  };
});
