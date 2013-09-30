define([
  "text!app-components/re-racking/_component.html",
  "app-components/re-racking/model",
  "app-components/dropzone/component",
  "app-components/barcode-scanner/scanner",

  // Code added to global namespace after this point
  "lib/underscore_extensions",
  "lib/jquery_extensions",
  "bootstrap/bootstrap-collapse"
], function (rerackingPartial, Model, DropZone, BarcodeScanner) {
  "use strict";

  var template = _.compose($, _.template(rerackingPartial));

  return function(context) {
    var model = Object.create(Model).init(context.app, context.app.config);
    var view  = createHtml(context, model);

    return {
      view:   view,
      events: {
        "s2.reception.reset_view": _.bind(view.reset, view)
      }
    };
  };

  function createHtml(context, model) {
    var html = template({
      printerList: _.filter(context.printers, function(p) { return p.type === 1; })
    });

    var messageView = html.find(".validationText");
    var message     = function(type, message) {
      messageView.removeClass("alert-error alert-info alert-success")
                .addClass("alert-" + type)
                .html(message)
                .show();
    };

    var error   = _.partial(message, "error");
    var success = _.partial(message, "success");

    var rackList = html.find("#rack-list");

    // Setup the re-racking buttons
    var printButton          = html.find("#print-rerack-btn");
    var startRerackingButton = html.find("#start-rerack-btn");
    var rerackButton         = html.find("#rerack-btn");
    printButton.click(process(html, _.partial(onPrintBarcode, html, model)));
    startRerackingButton.click(_.partial(onStartReracking, html));
    rerackButton.click(process(html, _.partial(onReracking, html, model, rerackButton)));
    html.on("s2.print.success", $.ignoresEvent(_.partial(success, "The barcodes have been sent to the printer.")));
    html.on("s2.reracking.complete", $.ignoresEvent(_.partial(success, "Re-racking completed.")));
    rerackButton.hide();

    // Build a barcode scanner component and hook it up.
    var barcodeScanner = BarcodeScanner({
      label: "Scan rack barcode",
      model: "rack"
    });
    html.find("#barcodeReader").append(barcodeScanner.view);
    html.on(barcodeScanner.events);
    html.on("s2.barcode.scanned.rack", resetMessage(function(event, barcode) {
      addRackCallback(html, factory, model, rackList, barcode).then(function() {
        startRerackingButton.show();
      });
      barcodeScanner.view.reset();
    }));
    html.on("s2.barcode.error", $.ignoresEvent(error));

    // Build the dropzone component and attach it
    var dropzone = DropZone(this);
    html.find("#dropzone").append(dropzone.view).on(dropzone.events);
    html.on("dropzone.file", resetMessage(process(html, $.ignoresEvent(_.compose(
      function() { return $.Deferred().resolve(undefined); },
      function() { rerackButton.show(); },
      _.partial(presentRack, html, factory),
      outputRackRepresentation,
      _.bind(model.setFileContent, model)
    )))));
    html.on("s2.reracking.complete", _.bind(dropzone.view.hide, dropzone.view));

    _.extend(html, {
      reset: function () {
        model.reset();

        rackList.empty();
        startRerackingButton.hide();
        rerackButton.hide();
        html.find(".output-labware").hide();
        html.find("#output").hide();
        printButton.hide();
        messageView.hide();
      }
    });

    return html;

    function resetMessage(f) {
      return function() {
        messageView.hide();
        return f.apply(this, arguments);
      };
    }

    function factory(representation, element) {
      var rackController = context.app.controllerFactory.createLabwareSubController(context.app, "tube_rack");
      rackController.setupController(representation, _.constant(element));
      return rackController;
    }
  }

  // FILE UPLOAD FUNCTIONS
  function outputRackRepresentation(model) {
    var movements =
      _.chain(model.tubeMoves.moves)
       .pluck("target_location")
       .reduce(function(memo, location){memo[location] = "full"; return memo;}, {})
       .value();

    return _.build("tube_rack", {
      resourceType: "tube_rack",
      barcode:      model.outputRack.labels.barcode.value,
      locations:    movements
    });
  }

  function presentRack(html, factory, representation) {
    var outputLabware        = html.find(".output-labware");
    var outputRackController = factory(representation, outputLabware);

    outputLabware.empty().show();
    outputRackController.renderView();
    return outputRackController;
  }

  // BARCODE PRINTING FUNCTIONS
  function onPrintBarcode(html, model) {
    var printerName = html.find("#printer-select").val();

    return model.printRackBarcode(printerName)
                .then(function () {
                  html.find("#racking-file-upload").collapse({parent: html});
                  html.trigger("s2.print.success");
                }, _.partial(structuredError, html, "Could not print the barcodes"));
  }

  // INPUT RACK HANDLING FUNCTIONS
  function addRackCallback(html, factory, model, rackList, barcode) {
    return model.addRack(barcode)
                .then(
                  _.partial(buildRackList, html, factory, rackList),
                  _.partial(structuredError, html, "Unable to add rack")
                );
  }

  function buildRackList(html, factory, rackList, model) {
    // render the rack list?
    var racks = _.map(model.inputRacks, _.partial(rackUI, html, factory));
    rackList.empty().append(_.pluck(racks, "item"));
    _.invoke(racks, "render");
    return model;
  }

  function rackUI(html, factory, rack, index) {
    var rackRepresentation = inputRackRepresentation(rack);
    var element            = $("<li><div class=\"resource\"></div></li>");
    var rackController     = factory(rackRepresentation, element.find(".resource"));

    return {
      item:   element,
      render: _.bind(rackController.renderView, rackController)
    };
  }

  function inputRackRepresentation(rack) {
    function tubeToCss(tube, location) {
      return [location, _.isEmpty(tube.aliquots) ? "empty" : "full"];
    }

    return _.build("tube_rack", {
      resourceType:  rack.resourceType,
      barcode:       rack.labels.barcode.value,
      locations:     _.chain(rack.tubes).map(tubeToCss).object().value()
    });
  }

  // RE-RACKING FUNCTIONS
  function onStartReracking(html) {
    html.find("#rack-labelling").collapse({parent: html});
  }

  function onReracking(html, model, button) {
    return model.rerack()
                .then(function () {
                  button.hide();
                  html.trigger("s2.reracking.complete");
                }, _.partial(structuredError, html, "Could not re-rack"));
  }

  function structuredError(html, prefix, error) {
    html.trigger("s2.status.error", [prefix + ": " + error.message]);
  }

  // Wraps a function in the process reporting.
  function process(html, f) {
    var start  = function() { html.trigger("s2.busybox.start_process"); };
    var finish = function() { html.trigger("s2.busybox.end_process"); };

    return function() {
      start();
      return f.apply(this, arguments).always(finish);
    };
  }
});

