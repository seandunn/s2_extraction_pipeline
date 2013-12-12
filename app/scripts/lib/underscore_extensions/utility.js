define([], function() {
  return {
    // Applies the mappings to the object given returning a new object.  The mappings are the an object that
    // has the fields to the functions to apply.
    mapFields: function(mappings, object) {
      var remapped =
        _.chain(mappings)
         .pairs()
         .filter(function(m) { return object.hasOwnProperty(m[0]); })
         .reduce(function(o, m) { o[m[0]] = m[1](object[m[0]]); return o; }, {})
         .value();

      return _.extend(_.clone(object), remapped);
    },

    // Applies the mapping to the given array, returning a new array.  The mappings are an array of pairs,
    // where the first element in the pair is the index, and the second is the function to apply to the value
    // at that index.
    mapIndexes: function(mappings, array) {
      return _.map(array, function(v, i) {
        return mappingAt(i)(v);
      });

      function mappingAt(index) {
        var pair = _.find(mappings, function(p) { return p[0] == index; });
        return pair ? pair[1] : _.identity;
      }
    },

    // Restructures a given (flat) object so that it fits the template structure specified.
    restructure: function(template, source) {
      return _.chain(template)
              .map(mapAttribute)
              .object()
              .value();

      function mapAttribute(sourceKey, targetKey) {
        var value = _.isObject(sourceKey) ? _.restructure(sourceKey, source) : source[sourceKey];
        return [targetKey,value];
      }
    },

    // Often we need to build a particular value in an object, possibly recursively.
    build: function() {
      var path = _.chain(arguments).reverse();
      var pair = path.take(2).value();

      return path.drop(2).reduce(build, build(pair[0], pair[1])).value();

      function build(value, name) {
        return _.object([[name, value]]);
      }
    },

    // Finds a given value in an array using a particular field.
    findBy: function(field, array, value) {
      var ar = _.find(array, function(v) {
        return v[field] === value[field];
      });
      return ar
    },

    // Recursively merges, left-to-right, all of the objects passed in the parameters.  Will
    // not merge arrays.
    deepMerge: function() {
      return _.reduce(arguments, deepMergeTwoObjects, {});
    },

    // recursively remove undefined keys from this JS object
    removeUndefinedKeys: function(object) {
      if      (_.isArray(object))    { return object; }
      else if (_.isFunction(object)) { return object; }
      else if (!_.isObject(object))  { throw "method can only handle plain objects"; }

      return _.reduce(object, function (memo, value, key) {
        if (_.isObject(value)) {
          value = _.removeUndefinedKeys(value);

          if (_.isTruthy(value) && !_.isEmpty(value)) {
            memo[key] = value;
          }

        } else if (!(_.isUndefined(value) || _.isNull(value) || _.isNaN(value))) {
          memo[key] = value;
        }

        return memo;
      }, {});
    },

    reverseRange: function(n) {
      return _.reverse(_.range(n));
    }
  };

  function deepMergeTwoObjects(target, source) {
    var mergingIn =
      _.chain(source)
       .pairs()
       .pairwise(_.compose(_.extractor(target), _.first))
       .map(flattenToTrio)
       .map(recursivelyMergeObjectValues)
       .object()
       .value();

    return _.extend(_.clone(target), mergingIn);
  }

  function flattenToTrio(pair) {
    return [pair[0][0], pair[0][1], pair[1]];
  }

  function recursivelyMergeObjectValues(trio) {
    var key = trio[0], sourceValue = trio[1], targetValue = trio[2];
    var value = undefined;
    if (_.isObject(sourceValue) && _.isObject(targetValue)) {
      value = deepMergeTwoObjects(targetValue, sourceValue);
    } else {
      value = sourceValue || targetValue;
    }
    return [key,value];
  }
});
