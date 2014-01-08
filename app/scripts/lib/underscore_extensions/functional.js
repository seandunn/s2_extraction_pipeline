define([], function() {
  "use strict";

  return {
    // Does nothing, simply ignores everything!
    ignore: function() {
    },

    // Returns a function that will return the specified value every time it's called
    constant: function(value) {
      return function() {
        return value;
      };
    },

    // Collapses the given reducible using the function f on every element.  zero is the initial
    // element which, if undefined, is []
    plus: function(reducible, f, zero) {
      return _.reduce(
        reducible,
        function(m, v) { m.push(f(v)); return m; },
        zero || []
      );
    },

    rejectFirst: function(list, iterator, context) {
      var found = false;

      return _.reject(list, function(listItem) {
        if (found === true) {
          return false;
        } else {
          var result = iterator(listItem);
          if (result === true) {
            found = true;
            return true;
          } else {
            return false;
          }
        }
      }, context);
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

    // Retrieves the specified field that may be optional along its path
    optional: function() {
      var path = arguments;
      return function(object) {
        return _.reduce(path, function(m,f) {
          return _.isUndefined(m) ? undefined : m[f];
        }, object);
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
    },

    // Generates a cross product of the parameters passed.  For example:
    //   crossProduction([1,2],[3,4]) => [[1,3],[1,4],[2,3],[2,4]]
    crossProduct: function() {
      return _.reduce(_.drop(arguments, 1), function(l, r) {
        return _.reduce(l, function(memo, lv) {
          return memo.concat(_.map(r, function(lr) { return lv.concat([lr]); }));
        }, []);
      }, _.map(arguments[0], function(v) { return [v]; }));
    },

    // Creates an array containing the times elements, each value
    repeat: function(value, times) {
      return _.times(times, _.partial(_.identity, value));
    },

    // Returns a function that is the complement (negation) of the specified function
    complement: function(f) {
      return function() {
        return !f.apply(this, arguments);
      };
    },

    // Returns a function that has the arguments of f in reverse order!
    flip: function(f) {
      return function() {
        return f.apply(this, _.reverse(arguments));
      };
    },

    // Reverses the array (cannot believe this isn't in underscore!)
    reverse: function(array) {
      return _.reduceRight(array, function(m, v) { m.push(v); return m; }, []);
    },

    // Returns true if the value is considered truthy
    isTruthy: function(value) {
      return value;
    },

    // Higher order function to create a composite function.  Return result is an array
    // of all return results from the functions passed.
    composite: function() {
      var functions = arguments;
      return function() {
        var target = this;
        var args   = arguments;
        return _.map(functions, function(f) { return f.apply(target, args); });
      };
    },

    // Repeatedly applying functions to extract data and then collapse that into a single object
    // structure.
    collapser: function(functions) {
      return function(memo) {
        var args = _.drop(arguments, 1);
        return _.reduce(functions, function(m,f) { return _.extend(m, f.apply(this, args)); }, memo);
      };
    }
  };
});
