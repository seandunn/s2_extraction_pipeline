define([
  "text!app-components/admin/_createKit.html"
], function (partialKit) {
  "use strict";

  var template= _.template(partialKit);
  
  return function(context) {
    var html = $(template(context));
    $("button", html).on("click", function() {
      var barcode = $(".new-barcode input", html).val(),
          process = $(".process input", html).val(),
          aliquot = $(".aliquot_type input", html).val(),
          expires = $(".expires input", html).val(),
          amount = $(".amount input", html).val();
      app.createKit(barcode, process, aliquot, expires, amount);
    });
    return {
      view: html,
      events: {}
    }
  };
});