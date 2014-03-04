define([
  "text!app-components/admin/_statusMgmt.html",
], function (partialStatus) {
  "use strict";

  
  var template= _.template(partialStatus);
  
  return function(context) {
    app.showOrdersUUID("2070003483672")
    var html = ""; //  = template(context);
    return {
      view:   html
    };
  };
});

