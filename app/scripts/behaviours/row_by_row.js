define([], function() {
  var row_by_row = {
    rowDone: function(callback) {
      callback();
    },
    pageDone: function(callback) {
      // Does nothing on a page being completed
    }
  };

  return {
    register: function(callback) {
      callback('row_by_row', function() {
        return row_by_row;
      });
    }
  };
});
