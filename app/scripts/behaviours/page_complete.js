define([], function() {
  var page_complete = {
    rowDone: function(callback) {
      // Does nothing on a row being completed
    },
    pageDone: function(callback) {
      callback();
    }
  };

  return {
    register: function(callback) {
      callback('page_complete', function() {
        return page_complete;
      });
    }
  };
});
