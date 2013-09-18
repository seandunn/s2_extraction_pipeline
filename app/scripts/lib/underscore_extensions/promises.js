define([], function() {
  return {
    // Similar to always, except that it behaves exactly as we need in most circumstances in that it
    // attaches the handler to both the resolve and reject states.
    regardless: function (deferred, handler) {
      return deferred.then(handler, handler);
    }
  };
});
