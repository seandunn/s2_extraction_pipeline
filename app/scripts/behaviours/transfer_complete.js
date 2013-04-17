define([], function() {
  var transfer_complete = {
    rowDone: function(callback) {
      // Does nothing on a row being completed
    },
    pageDone: function(callback) {
      // Does nothing on page done
    },
    transferDone: function(callback) {
      callback();
    }
  };

  return {
    register: function(callback) {
      callback('transfer_complete', function() {
        return transfer_complete;
      });
    }
  };
});
