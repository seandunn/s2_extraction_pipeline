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

  var typeUuidStubs = {
    tube: "11111111-2222-3333-4444-00000000"
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

  function generateUuidFromBarcode(barcode, type) { 
    return typeUuidStubs[type] + barcode.slice(4);
  }

  var ResourcePromise = function (uuid, sendAction, data) {
    var resourceDeferred = $.Deferred();
    var that = this;
    var path = this.pathFromUuid(uuid);

    console.log("path is ", path);
    if (typeof path !== "string") {
      debugger;
    }
    

    send((sendAction || 'read'), '/' + path, data).
        done(function (response) {

          var rawJson = response; //response.responseText;
          var resource = Object.create(null);
	  console.log("dummy resource");
          resource.rawJson = that.mutateJson(rawJson, uuid); 

          // The resourceType is the first and only attribute of the rawJson
          resource.resourceType = Object.keys(rawJson)[0];

          // Add the JSON's actions as functions on the Resource object
          for (var action in rawJson[resource.resourceType].actions) {
            resource[action] = function (sendData) {
              return new ResourcePromise(path, action, data);
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
    var tubeBarcodeRegex = /^tube[0-9]{4}/;
    if (tubeUuidRegex.test(uuid) || tubeBarcodeRegex.test(uuid)) {
      console.log("Recognised tube-like uuid");
      return resourceUris.tube;
      }
    
    console.log("Assuming uuid is the path");
    return uuid;
  }

  ResourcePromise.prototype.mutateJson = function(json,uuidOrBarcode) {
    // Default behavior: make json uuid match requested uuid

    console.log("default mutate json");

    var type;
    if(json.tube) {
      type = "tube";
    } else if (json.order) {
      type = "order";
    } // TODO etc

    // add batch if necessary
    console.log("uuid or barcode ", uuidOrBarcode);
    console.log("uuid or barcode length", uuidOrBarcode.length);
    var patchedUuid = uuidOrBarcode.length > 13 ?
      uuidOrBarcode : generateUuidFromBarcode(uuidOrBarcode, type);
 
    console.log("uuid is ", patchedUuid);
    
    if(type && json[type]) { 
      console.log("patching uuid");
      console.log("before", json);
      console.log("type", type);
      json[type].uuid = patchedUuid.slice(9); 
    } else { 
      console.log("leaving uuid alone");
    }
    
    console.log("dummy resource mutated json ", json);
    return json;
  }

  return ResourcePromise;
});

