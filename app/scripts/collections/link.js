define([], function() {

  function linkMapper(method, methodName, proto) {
    proto[methodName] = _.wrap(method, function(fn) {
      var args = _.rest(arguments, 1);

      if (this._next) {
        this._next = fn.apply({ collection: this._next }, args);
        return this;
      } else {
        return fn.apply(this, args);
      }
    });
  };

  var Link = function(subClass) {
    var mixins = {
      chain: function(fn) {
        this._next = this.collection;
        return this;
      },
      value: function(fn) {
        var ret = this._next;
        this._next = null;
        return ret;
      }
    }

    _.each(subClass.prototype, linkMapper, subClass);
    return _.extend(subClass.prototype, mixins);
  }

  return Link;
});