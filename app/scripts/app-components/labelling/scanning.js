define([
  "text!app-components/labelling/_scanning.html",
  "lib/util"
], function(View, Util) {
  var template = _.compose($, _.template(View));

  return function (context) {
    var html  = template(_.extend({
      label: undefined
    }, context));
    var error = _.bind(_.partial(html.trigger, "s2.barcode.error"), html);

    var barcode = html.find("input[type=text]");
    barcode.enterHandler(function() {
      // TODO: Probably should check for a valid barcode
      var padded = _.string.lpad(barcode.val(), context.length || 13, "0");
      barcode.val(padded).trigger("s2.barcode.scanned." + context.model, [padded]);
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
