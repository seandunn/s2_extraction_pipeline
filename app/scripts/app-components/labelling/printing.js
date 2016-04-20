//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  "text!app-components/labelling/_printing.html",
  "mapper_services/print",
  "config",

  // Global namespace requires
  "lib/jquery_extensions"
], function(view, PrintService, config) {
  "use strict";

  var template = _.compose($, _.template(view));

  return function(externalContext) {
    var context = _.extend({
      user: $.Deferred().resolve(undefined)
    }, externalContext);

    var html = template();
    var printer = html.find("select");
    filter(_.constant(true));             // Display all printers until told!

    var success = function(message) {
      html.trigger("success.status.s2", [message]);
      html.trigger("done.s2", html);
    };
    var error   = function(message) {
      html.trigger("error.status.s2", [message]);
    };

    var obj = {};
    var button  = html.find("button");
    button.lockingClick(_.bind(function() {
      obj.beforePrint().then(function() {
        var selected = _.find(context.printers, function(p) { return p.name === printer.val(); });
        html.trigger("trigger.print.s2", [selected]);        
      });
    }, obj));

    _.extend(html, {
      print:  $.ignoresEvent(print),
      filter: $.ignoresEvent(filter)
    });

    _.extend(obj, {
      name: "printing.labelling.s2",
      view: html,
      events: {
        "labels.print.s2": _.bind(html.print, view),
        "filter.print.s2": _.bind(html.filter, view),
        "activate.s2":     $.stopsPropagation($.ignoresEvent(_.partial(disable, false, printer, button))),
        "deactivate.s2":   $.stopsPropagation($.ignoresEvent(_.partial(disable, true, printer, button)))
      },
      beforePrint: function() {
        var deferred = new $.Deferred();
        deferred.resolve(true);
        return deferred;
      },
      print: print
    });

    return obj;
    
    function disable(state) {
      _.chain(arguments)
       .drop(1)
       .each(function(e) { e.prop("disabled", state); })
       .value();
    }

    // Prints the specified printable objects to the given printer
    function print(details, printables) {
      var printer = _.find(PrintService.printers, function(printer){
        return printer.name === details.name;
      });

      return config.userPromise.then(function(user) {
        return printer.print(
          _.invoke(printables, "returnPrintDetails"),
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
  };

  function printerOption(printer) {
    return "<option value=\"" + printer.name + "\">" + printer.friendlyName + "</option>";
  }
});
