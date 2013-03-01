// TODO : This resource is for development only. MUST be deleted once the mapper will be up and running.


define([], function () {
  "use strict";

  var actionMethods = {
    search:'POST', // This a POST because we are creating a search object
    first:'GET',
    create:'POST',
    read:'GET', // Read maps to GET
    last:'GET',
    update:'PUT', // Update maps to PUT
    delete:'DELETE'  // Update maps to PUT
  };

  var resourceUris = {
    tube:'components/s2-api-examples/tube.json'
  };

  function send(action, actionPath, data) {
    return $.ajax({
      type:actionMethods[action],
      url:actionPath,
      contentType:"json",
      dataType:"json",
      data:data
    });
  }

  var ResourcePromise = function (uuid, sendAction, data) {
    var resourceDeferred = $.Deferred();
    var that = this;
    var path = this.pathFromUuid(uuid);

    console.log("path is ", path);

    send((sendAction || 'read'), '/' + path, data).
        done(function (response) {

          var rawJson = response; //response.responseText;
          var resource = Object.create(null);
          resource.rawJson = that.mutateJson(rawJson, uuid); 

          // The resourceType is the first and only attribute of the rawJson
          resource.resourceType = Object.keys(rawJson)[0];

          // Add the JSON's actions as functions on the Resource object
          for (var action in rawJson[resource.resourceType].actions) {
            resource[action] = function (sendData) {
              return new ResourcePromise(uuid, action, data);
            };
          }

          resourceDeferred.resolve(resource);
        }).fail(function () {
          console.log("fail?")
        });

    return resourceDeferred.promise();
  };

  ResourcePromise.prototype.pathFromUuid = function(uuid) {
    
    var tubeUuidRegex = /^1{8}-2{4}-3{4}-4{4}/;
    if (tubeUuidRegex.test(uuid)) {
      console.log("Recognised tube-like uuid");
      return resourceUris.tube;
      }
    
    console.log("Assuming uuid is the path");
    return uuid;
  }

  ResourcePromise.prototype.mutateJson = function(json,uuid) {
    // Default behavior: make json uuid match requested uuid
    var type;
    if(path.tube) {
      type = "tube";
    } else if (path.order) {
      type = "order";
    } // TODO etc
    
    if(type && json[type]) { json[type].uuid = uuid; }
    return json;
  }

  return ResourcePromise;
});

