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
    }
  };
});
