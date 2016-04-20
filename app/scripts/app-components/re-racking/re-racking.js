//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  "text!app-components/re-racking/_component.html",
  "app-components/re-racking/model",
  "app-components/dropzone/dropzone",
  "app-components/labelling/scanning",
  "app-components/labelling/printing",

  // Code added to global namespace after this point
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (rerackingPartial, Model, DropZone, BarcodeScanner, LabelPrinter) {
  "use strict";

  var template = _.compose($, _.template(rerackingPartial));

  return function(context) {
    var model = Object.create(Model).init(context.app, context.app.config);
    var view  = createHtml(context, model);

    return {
      name:   "re-racking.s2",
      view:   view,
      events: {
        "reset_view.reception.s2": _.bind(view.reset, view)
      }
    };
  };

  function createHtml(context, model) {
    var html = template();

    var message        = function(type, message) { html.trigger(type + ".status.s2", message); };
    var error          = _.partial(message, "error");
    var success        = _.partial(message, "success");

    var rackList = html.find("#rack-list");

    // Setup the label printing
    var labelPrinter = LabelPrinter({
      printers: _.filter(context.printers, function(p) { return p.canPrint("tube_rack"); }),
      print:    context.print
    });
    html.find("#printer-area").append(labelPrinter.view);
    html.on(labelPrinter.events);
    html.on("trigger.print.s2", $.ignoresEvent(_.partial(onPrintLabels, html, model)));

    // Setup the re-racking buttons
    var startRerackingButton = html.find("#start-rerack-btn");
    startRerackingButton.click(_.partial(onStartReracking, html));

    // Build a barcode scanner component and hook it up.
    var barcodeScanner = BarcodeScanner({
      label: "Rack",
      icon: "icon-barcode"
    });
    html.find("#barcodeReader").append(barcodeScanner.view);
    html.on(barcodeScanner.events);
    html.on("scanned.barcode.s2", $.haltsEvent(function(event, barcode) {
      addRackCallback(html, factory, model, rackList, barcode).then(function() {
        startRerackingButton.show();
      });
      barcodeScanner.view.reset();
    }));
    html.on("error.barcode.s2", $.ignoresEvent(error));

    // Build the dropzone component and attach it
    var dropzone = DropZone(this);
    html.find(".dropzone").append(dropzone.view).on(dropzone.events);

    html.on("dropzone.file", function(e, fileContent) {
      function beforePrint() {
        return onReracking(html,model)
          .then(_.partial(success, "Re-racking was successful. Please print the label for the new rack"));
      }
      
      html.trigger("start_process.busybox.s2");

      labelPrinter.beforePrint = beforePrint;
      
      model.validateRackLayout(fileContent)
        .then(_.partial(createOutputRackAndSetupTransfers, html, factory, model))
        .then(_.partial(success, "File validated"))
        .then(function() {
          html.find("#rack-labelling").collapse({ parent: '.accordion' });
        })
        .fail(error)
        .always(_.bind(html.trigger, html, "end_process.busybox.s2"));
    });

    _.extend(html, {
      reset: function () {
        model.reset();

        rackList.empty();
        startRerackingButton.hide();
        rerackButton.hide();
        html.find(".output-labware").hide();
        html.find("#output").hide();
        labelPrinter.view.hide();
      }
    });

    return html;

    function factory(representation, element) {
      var rackController = context.app.controllerFactory.createLabwareSubController(context.app, "tube_rack");
      rackController.setupController(representation, _.constant(element));
      return rackController;
    }
  }

  // FILE UPLOAD FUNCTIONS

  function createOutputRackAndSetupTransfers(html, factory, model, targetsByBarcode) {
    return model.createOutputRack()
      .then(function() {
        model.setupTubeTransfers(targetsByBarcode);
        presentRack(html, factory, outputRackRepresentation(model));
      });
  }

  function outputRackRepresentation(model) {
    var movements = _.chain(model.tubeMoves.moves)
       .pluck("target_location")
       .reduce(function(memo, location){memo[location] = "full"; return memo;}, {})
       .value();

    return {
     resourceType: "tube_rack",
     barcode:      model.outputRack.labels.barcode.value,
     locations:    movements
    };
  }

  function presentRack(html, factory, representation) {
    var outputLabware        = html.find(".output-labware");
    var outputRackController = factory(representation, outputLabware);

    outputLabware.empty().show();
    outputRackController.renderView();
    return outputRackController;
  }

  // LABEL PRINTING FUNCTIONS
  function onPrintLabels(html, model, printer) {
    html.trigger("labels.print.s2", [printer, [model.outputRack]]);
    return model.outputRack;
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

    return {
      resourceType:  rack.resourceType,
      barcode:       rack.labels.barcode.value,
      locations:     _.chain(rack.tubes).map(tubeToCss).object().value()
    };
  }

  // RE-RACKING FUNCTIONS
  function onStartReracking(html) {
    html.find("#racking-file-upload").collapse();
  }

  function onReracking(html, model) {
    return model.rerack()
    .fail(_.partial(structuredError, html, "Could not re-rack"));
  }

  function structuredError(html, prefix, error) {
    html.trigger("error.status.s2", [prefix + ": " + error.message]);
  }

  // Wraps a function in the process reporting.
  function process(html, f) {
    var start  = function() { html.trigger("start_process.busybox.s2"); };
    var finish = function() { html.trigger("end_process.busybox.s2"); };

    return function() {
      start();
      return f.apply(this, arguments).always(finish);
    };
  }
});

