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
    }
  };
});
