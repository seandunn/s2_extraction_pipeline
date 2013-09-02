define([], function() {
  return {
    // Convenience function to deal with correcting "A01" to "A1"
    remapLocation: function(location) {
      var positionRow = location[0];
      var positionColumn = location.substring(1, location.length);
      return positionRow + parseInt(positionColumn);
    }
  };
});
