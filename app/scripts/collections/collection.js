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