//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([], function() {
  'use strict';

  return {
    renderView: function() {
      var labware = this.labware();
      return this.drawLabware(labware, this.imageFor(labware));
    },

    release: function() {
      this.container().empty();
    },

    drawLabware: function(labware, image) {
      this.release();

      var container = this.container();

      container.append(document.importNode(image, true));

      // Ensure the tube is filled, and that an unused marker is displayed if necessary.
      container.find("svg #aliquot").attr('class', cssForType(labware.type));
      container.find("svg #unused")[labware.tracked === false ? 'show' : 'hide']();

      // Display the extraneous data
      _.chain(labware)
       .omit(['resourceType', 'tracked'])
       .each(displayValueIfSet)
       .value();

      return this;

      function displayValueIfSet(value, field) {
        var element = container.find("svg #" + field);
        if (_.isUndefined(value)) {
          element.hide();
        } else {
          element.show().find(".value").text(value);
        }
      }

      function cssForType(type) {
        return _.isUndefined(type) ? "empty" : type.replace(/\W+/, '_').toLowerCase();
      }
    }
  };
});
