define([
  "app-components/component",

  "app-components/manual-racking/model",
  "app-components/manual-racking/racking-behaviour",
  "text!app-components/manual-racking/_component.html",
  "app-components/button/buttonRow",
  "app-components/labware/display",
  "app-components/labelling/printing",
  "app-components/labelling/scanning",

  "lib/barcode_checker",

  "mapper/operations",

  // Global namespace requirements
  "lib/underscore_extensions",
  "lib/jquery_extensions"
], function (Component, Model, Racking, View, ButtonRow, LabwareDisplay, 
  Printer, Scanner, BarcodeChecker, Operations) {
  "use strict";
  
  function ManualRacking(context) {
    this.viewTemplate = View;
    this.model = Object.create(Model).init(context.owner);
    this.labware = new LabwareDisplay(context.config.output[0]);

    this.components = {
      buttons: {
        constructor: ButtonRow,
        args:        context.config
      },
      racking: {
        constructor: Racking,
        args: {
          labware: this.labware,
          aliquotType: context.config.output[0].aliquotType,
          rows:    context.config.output[0].attributes.number_of_rows,
          columns: context.config.output[0].attributes.number_of_columns
        }
      },
      printer: {
        constructor: Printer,
        args:        context
      },
      scanner: {
        constructor: Scanner,
        args:        {
          validation: BarcodeChecker.isBarcodeValid
        }
      }
    }
    
    Component.apply(this, [context]);

    return {
      view:   this.view,
      release: _.bind(this.release, this)
    };
  };

  _.extend(ManualRacking.prototype, Component.prototype);

  ManualRacking.prototype._setupListeners = function() {
    this.addListeners("labelPrinted", [
      _.bind(this._sendStatus, this, "success", "Barcode label printed."),
      _.bind(this._start, this)
    ]);

    this.addListeners("reset", [
      _.bind(this._sendStatus, this, "info", "Rack reset. Please empty the rack."),
      _.bind(this._hideUserInstruction, this),
      _.bind(this._disableRackingButtons, this),
      _.bind(this._start, this)
    ]);

    this.addListeners("tubeAdded", [
      _.bind(this._sendStatus, this, "success", "Tube validated."),
      _.bind(this._showUserInstruction, this),
      _.bind(this._enableRackingButtons, this)
    ]);

    this.buttons.print.view.filter("button").on("click", _.bind(this._createRackAndPrintBarcode, this));
    this.buttons.reset.on("click", _.bind(this._reset, this));
    this.buttons.accept.on("click", _.bind(this._saveTubesInRack, this));
    this.buttons.done.on("click", _.bind(this._triggerDone, this));

    this.view.on("scanned.barcode.s2", _.bind(this._onScannedBarcode, this));
  }

  ManualRacking.prototype.release = function() {
    this.removeAllListeners();
    this.view.off();
    this.buttons.print.off();
    this.buttons.reset.off();
    this.buttons.accept.off();
    this.buttons.done.off();
  }

  ManualRacking.prototype._afterInit = function() {
    this._triggerComponentDisplays();
    this.buttons.print.enable();
    this.scanner.disable();
  }

  ManualRacking.prototype._triggerComponentDisplays = function() {
    this.view.trigger("display.labware.s2", this.config.output[0]);
    this.view.trigger("activate.s2");
  }

  ManualRacking.prototype._attachComponents = function() {
    this.view.find(".labware").append(this.labware.view);
    this.view.find(".scanner").prepend(this.scanner.view);
    this.view.on(this.labware.events);
    this.view.on(this.scanner.events);
    this.view.append(this.buttons.view);
  }

  ManualRacking.prototype._start = function() {
    this.buttons.print.disable();
    this.scanner.reset();
  }

  ManualRacking.prototype._next = function() {
    if (this.racking.nextLocation() !== false) {
      this.scanner.reset();
    } else {
      this.scanner.disable();
      this._sendStatus("info", "Rack full.");
    }
  }

  ManualRacking.prototype._reset = function() {
    this.racking.empty();
    this.emitEvent("reset");
  }

  ManualRacking.prototype._onScannedBarcode = function(e) {
    this.view.trigger("deactivate.s2");
    this._hideUserInstruction();

    this.model.fetchByBarcode(this.scanner.getBarcode(), this.config.input.model)
      .then(_.bind(this._getTubeOrderItems, this))
      .then(_.bind(this._validateTube, this))
      .then(_.bind(this._addTubeToRack, this))
      .fail(_.bind(this._scanningError, this));
  }

  ManualRacking.prototype._scanningError = function(message) {
    this._sendStatus("error", message);
    this.scanner.reset();
  }
  
  ManualRacking.prototype._addTubeToRack = function(tube) {
    if (this.racking.addTube(tube, this.racking.currentLocation) === true) {
      this.emitEvent("tubeAdded");
      this.racking.highlightRackSlot(this.racking.currentLocation);
      this._next();
    } else {
      this._sendStatus("error", "There was an error adding the tube to the rack! Please contact an administrator.")
    }    
  }

  ManualRacking.prototype._enableRackingButtons = function() {
    this.buttons.reset.enable();
    this.buttons.accept.enable();
  }

  ManualRacking.prototype._disableRackingButtons = function() {
    this.buttons.reset.disable();
    this.buttons.accept.disable();
  }

  ManualRacking.prototype._saveTubesInRack = function() {
    this.racking.save(this.config.output[0].role)
      .then(
        _.bind(this._sendStatus, this, "success", "The rack has been updated!"),
        _.bind(this._sendStatus, this, "error")
      )
      .then(_.bind(this._disableRackingButtons, this))
      .then(_.bind(this.buttons.done.enable, this));
  }

  ManualRacking.prototype._triggerDone = function() {
    
    this.context.owner.childDone(this, "done", {});
  }
  
  // Doesn't belong here...
  ManualRacking.prototype._getTubeOrderItems = function(tube) {
    var _this = this;
    return tube.order().then(function(order) {
      return {
        items: order.items[_this.config.accepts],
        tube:  tube
      }
    });
  }

  // Doesn't belong here...
  ManualRacking.prototype._validateTube = function(args) {
    var deferred      = $.Deferred(),
        errorMessages = [];

    // Doesn't belong here...
    function validItems(items, tube) {
      return _.filter(items, function(item) {
        return item.uuid == tube.uuid &&  item.status == "done";
      });
    }

    // Doesn't belong here...
    function tubeAlreadyInRack(tubes, tubeToAdd) {
      return _.where(_.pluck(tubes, "tube"), { uuid: tubeToAdd.uuid }).length > 0;
    }
    
    if (validItems(args.items, args.tube).length < 1) {
      errorMessages.push("Tube does not have the correct role.")
    }

    if (tubeAlreadyInRack(this.racking.tubes, args.tube)) {
      errorMessages.push("Tube is already in rack");
    }

    return (errorMessages.length > 0) 
              ? deferred.reject(errorMessages.join("\n")) : deferred.resolve(args.tube);
  }

  // Doesn't belong here...
  ManualRacking.prototype._createRackAndPrintBarcode = function(e) {
    var output = this.config.output[0];

    this.context.owner.getS2Root()
      .then(_.bind(createTubeRack, this, output))
      .then(_.bind(this._attachBarcode, this))
      .then(_.bind(printLabel, this))
      .then(_.bind(function() {
        this.emitEvent("labelPrinted");
      }, this));
  }

  ManualRacking.prototype._attachBarcode = function(state) {
    this.racking.setResource(state.labware);
    this.racking.setBarcode(state.barcode.ean13);
    return state;
  }

  ManualRacking.prototype._showUserInstruction = function() {
    var currentLocation = this.racking.currentLocation;
    this.view.find("span.instruction")
      .html("<p>Please add tube to rack slot <b>" + currentLocation + "</b></p>" 
        +"<p>Once completed, please continue by scanning another tube</p>")
      .show()
  }

  ManualRacking.prototype._hideUserInstruction = function() {
    this.view.find("span.instruction").hide();
  }
  
  // Doesn't belong here...
  function createTubeRack(output, root) {
    return Operations.registerLabware(
      root[output.model.pluralize()],
      output.aliquotType,
      output.purpose,
      {
        number_of_rows: output.attributes.number_of_rows,
        number_of_columns: output.attributes.number_of_columns
      }
    )
  }

  // Doesn't belong here...
  function printLabel(state) {
    var printerValue = this.buttons.view.find("select").val(),
        selectedPrinter = _.find(this.config.printerList, function(printer) {
          return printer.name = printerValue;          
        });
    
    return this.printer.print(selectedPrinter, [state.labware]);
  }

  return ManualRacking;
});