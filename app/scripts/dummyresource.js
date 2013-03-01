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

    send((sendAction || 'read'), '/' + uuid, data).
        done(function (response) {

          var rawJson = response; //response.responseText;
          var resource = Object.create(null);
          resource.rawJson = that.mutateJson(rawJson); 

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

  ResourcePromise.prototype.mutateJson = function(json) {
    return json;
  }

  return ResourcePromise;
});

