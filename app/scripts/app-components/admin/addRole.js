define([
  "text!app-components/admin/_addRole.html"
], function (partialKit) {
  "use strict";

  var template= _.template(partialKit);
  
  return function(context) {
    var html = $(template(context));
    $("button", html).on("click", function() {
      var barcode = $(".new-barcode input", html).val(),
          orderUuid = $(".order input", html).val(),
          role = $(".role input", html).val();
      app.addRole(barcode, orderUuid, role);
    });
    return {
      view: html,
      events: {}
    }
  };
});