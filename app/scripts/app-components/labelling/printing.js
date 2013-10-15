define([
  "text!app-components/labelling/_printing.html",
  "mapper_services/print",

  // Global namespace requires
  "lib/jquery_extensions"
], function(view, PrintService) {
  var template = _.compose($, _.template(view));

  return function(context) {
    var view = createHtml(context);
    return {
      view: view,
      events: {
        "s2.print.labels": _.bind(view.print, view),
        "s2.print.filter": _.bind(view.filter, view)
      }
    };
  };

  function createHtml(externalContext) {
    var context = _.extend({
      user: $.Deferred().resolve(undefined)
    }, externalContext);

    var html = template();
    var printer = html.find("select");
    filter(_.constant(true));             // Display all printers until told!

    var success = function(message) {
      html.trigger("s2.status.success", [message]);
      html.trigger("s2.print.success", [message]);
    };
    var error   = function(message) {
      html.trigger("s2.status.error", [message]);
      html.trigger("s2.print.error", [message]);
    };

    var button  = html.find("button");
    button.lockingClick(function() {
      var selected = _.find(context.printers, function(p) { return p.name == printer.val(); });
      html.trigger("s2.print.trigger", [selected]);
    });

    _.extend(html, {
      print:  $.ignoresEvent(print),
      filter: $.ignoresEvent(filter)
    });

    return html;

    // Prints the specified printable objects to the given printer
    function print(details, printables) {
      var printer = _.find(PrintService.printers, function(printer){
        return printer.name === details.name;
      });

      return context.user.then(function(user) {
        return printer.print(
          _.invoke(printables, 'returnPrintDetails'),
          {user:user}
        );
      }).then(function() {
        return success("The labels have been sent to the printer!");
      }, function() {
        return error("Could not print the labels");
      }).always(function() {
        button.prop("disabled", false);
      });
    }

    // Filters the list of printers based on the predicate passed
    function filter(predicate) {
      printer.html(
        _.chain(context.printers)
        .filter(predicate)
        .map(printerOption)
        .value()
      );
    }
  }

  function printerOption(printer) {
    return "<option value=\"" + printer.name + "\">" + printer.friendlyName + "</option>";
  }
});
