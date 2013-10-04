define([], function() {
  return {
    // Collapses the given reducible using the function f on every element.  zero is the initial
    // element which, if undefined, is []
    plus: function(reducible, f, zero) {
      return _.reduce(
        reducible,
        function(m, v) { m.push(f(v)); return m; },
        zero || []
      );
    },

    // Turns the given function into a function that will map f across the argument passed
    mapper: function(f) {
      return function(array) {
        return _.map(array, f);
      };
    },

    picker: function(fields) {
      return function(object) {
        return _.pick(object, fields);
      };
    },

    // Returns a function that will extract the given field from any object passed
    field: function(name) {
      return function(object) {
        return object[name];
      };
    },

    // Given an object will return a function that will extract the value of the given field.
    extractor: function(object) {
      return function(field) {
        return object[field];
      };
    },

    // Groups the given array by the function g, then applies the function f to the groupings.
    groupMap: function(array, g, f) {
      return _.chain(array)
              .groupBy(g)
              .map(f)
              .object()
              .value();
    },

    // Returns a function that will call the given member function when passed an object.  Note
    // that addition parameters can be specified at call time but are static for each call to
    // the returned function.
    callMemberFunction: function(name) {
      var params = _.drop(arguments, 1);
      return function(object) {
        return object[name].apply(object, params);
      };
    },

    // Used typically to pair up elements of one array using a specific function.
    pairwise: function(array, f) {
      return _.map(array, function(v) { return [v, f(v)]; });
    },

    // Returns a function that will call the given function, with any arguments passed at the
    // point of calling this function.  Return function completely ignores any arguments passed.
    call: function(f) {
      var args = arguments;
      return function() {
        return f.apply(this, args);
      };
    }
  };
});
