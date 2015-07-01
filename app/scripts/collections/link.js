//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
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
