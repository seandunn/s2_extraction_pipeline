define([
  "text!app-components/user-barcode/_scanner.html",
  "lib/util"
], function(View, Util) {
  var template = _.template(View);

  return function (context) {
    var html  = $(template());
    var error = _.bind(_.partial(html.trigger, "s2.search.error"), html);

    var barcode = html.find("#user-barcode");
    barcode.enterHandler(function() {
      // TODO: Probably should check for a valid barcode
      var padded = Util.pad(barcode.val());
      barcode.val(padded).trigger("s2.search.user", [padded]);
    });

    _.extend(html, {
      reset: function() {
        barcode.val("").prop("disabled", false);
      }
    });

    return {
      view: html,
      events:{"s2.reception.reset_view": _.bind(html.reset, html)}
    };
  }
});
