define(function() {

  function promiseTrackingInfo(settings) {
    return _.extend({}, {
      number_of_thens: 0,
      thens_called: 0,
      callbacks: {},
      origConfig: settings
    }, settings);
  }
  
  var promises = [];

  return function promise_tracker(promise, config) {

    if (!isPromise(promise)) {
      return promise;
    }

    var config = config || {},
        uniq = config.uniq,
        fnThen = promise.then,
        newCallbacks = ['beforeThen', 'afterThen'],
        thisPromise = promises[uniq];

    // Create a unique id for  this chain of promises
    if (_.isUndefined(uniq)) {
      uniq = _.uniqueId();
      
      thisPromise = promises[uniq] = promiseTrackingInfo(_.omit(config, 'uniq'));
      
      if (_.isEmpty(thisPromise.callbacks)) {
        thisPromise.callbacks = setupCallbacks(newCallbacks);
      }
    }

    // Add extra callbacks to the promise
    _.reduce(newCallbacks, function(memo, val) {
        memo[val] = createCallback(val);
        return memo
    }, promise);

    // Decorate the promise's then method 
    promise.then = _.wrap(fnThen, function(fn) {
      var args = _.rest(arguments, 1),
          doneFn = args[0];

      args[0] = decorateDoneCallback(doneFn);

      incrementNumberOfThens();
      
      return promise_tracker(fn.apply(null, args), {uniq: uniq});
    });

    // Expose the original then
    promise.fnThen = fnThen;

    // Method to return tracking information about the promise
    promise.track = function() {
      return thisPromise;
    }

    // And we're done :)
    return promise;

    function isPromise(promise) {
      return (_.isObject(promise) && _.isFunction(promise.promise))
    }

    // Create callbacks list on unique hash
    function setupCallbacks(callbacks) {
      return _.reduce(callbacks, function(memo, val){
        memo[val] = $.Callbacks();
        return memo;
      }, {});
    }

    function createCallback(callback) {
      return function(fn) {

        thisPromise.callbacks[callback].add(fn);

        // Return a new promise that's being tracked with the same id
        return promise_tracker(promise.fnThen(_.identity), {uniq: uniq});;
      }
    }

    function decorateDoneCallback(done) {
      return function() {
        // Fire the beforeThen callback
        thisPromise.callbacks.beforeThen.fire(promise.track(), done);

        // Invoke the done callback
        var res = done.apply(null, _.toArray(arguments));
        thisPromise.thens_called++;

        if (isPromise(res)) {
          // If the done callback returns another promise, the afterThen callback
          // has to be fired in a then (the non-wrapped one :)
          return promise_tracker(res, {uniq: uniq})
                  .fnThen(function(args) {
                    thisPromise.callbacks.afterThen.fire(promise.track(), done);
                    return args;
                  });
        } else {
          // Else just fire the afterThen callback
          thisPromise.callbacks.afterThen.fire(promise.track(), done);
          return res;
        }
      }
    }

    function incrementNumberOfThens() {
      if (thisPromise.origConfig.number_of_thens) return;
      thisPromise.number_of_thens++;
    }

  }
})