//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([], function() {

  var Collection;

  function fetchResource(item) {
    return item.fetchResource();
  }

  Collection = function() { };

  Collection.prototype.fetchResources = function() {
    var deferred  = $.Deferred(),
        resources = _.map(this.collection, fetchResource);

    $.when.apply(null, resources).then(function() {
      deferred.resolve(_.toArray(arguments));
    });

    return deferred.promise();
  }

  return Collection;
});
