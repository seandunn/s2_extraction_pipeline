define([], function() {
  'use strict';
  
  return $.extend({}, {
    layoutDistribution: function(source, destinations, posController, location) {
      // In biorobot the destinations is only one plate
      var destination = destinations[0];
      
      var letter = location[0];
      
      var numColumn = parseInt(location[1], 10)-1;
      var numLetter = "A".charCodeAt(0) - letter.charCodeAt(0);
      
      var columnDestination = (Math.floor(numColumn / 2) + (posController * 3));
      var letterDestination = [letter, String.fromCharCode(letter.charCodeAt(0) + source.number_of_rows)][numColumn % 2];
      return letterDestination+(columnDestination+1);
    }
  });
});
