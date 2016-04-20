//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([], function() {

  var LocationModel;

  LocationModel = function(args) {
    var location = args["location"] || {};

    this.owner = args["owner"];

    this.name     = location["name"] || "";
    this.address  = location["address"]  || "";
    this.internal = location["internal"] || "";
    this.uuid     = location["uuid"] || "";
  };

  LocationModel.prototype.update = function(uuid, args){
    var deferred = $.Deferred();

    this.owner.getS2Root().then(function(root) {
      root.find(uuid).then(function(resource) {
        resource.update(args)
          .then(function() {
            deferred.resolve();
        })
      })
    });

    return deferred.promise();
  }
  
  return LocationModel;
});
