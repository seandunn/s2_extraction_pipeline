define([
  "controllers/base_controller",
  "text!html_partials/_reracking.html",
  "models/reracking_model",
  "lib/pubsub",
  "lib/util",
  "views/drop_zone"
], function (BaseController, rerackingPartial, Model, PubSub, Util, DropZone) {
  "use strict";

  function barcodeErrorCallback(errorText) {
    return function (event, template, controller) {
      controller.message("error", errorText);
    };
  }

  function addRackCallback(event, labwareHtml, controller) {
    $(".validationText").hide();

    var barcode = Util.pad(event.currentTarget.value);

    controller.model
    .then(function (model) {
      return model.addRack(barcode);
    })
    .then(function (model) {
      // render the rack list?
      var rackList = _.map(model.inputRacks, _.partial(rackUI, controller));

      controller.html.find("#rack-list").empty().append(_.pluck(rackList, "item"));

      _.invoke(rackList, "render");

      return model;
    }, function (error) {
      controller.message("error", error.message);
    })

    .then(function(){
      controller.html.find("#start-rerack-btn").show();
    });

    labwareHtml.find("input").val(""); // clear the input
  }

  function rackUI(thisController, rack, index) {

    var rackController = thisController.factory.createLabwareSubController(thisController, "tube_rack");

    var rackRepresentation = representAsLabware(rack);

    rackController.setupController(
      _.build("tube_rack", rackRepresentation),
      function() {
        return thisController.html.find("#rack-list li:nth("+index+") .resource");
      }
    );


    return {
      item:   "<li><div class='resource'></div></li>",
      render: function() { rackController.renderView(); }
    };
  }

  function representAsLabware(rack) {
    function tubeToCss(tube, location) {
      return [location, empty(tube) ? "empty" : "full"];
    }

    function empty(tube) { return tube.aliquots.length === 0; }

    return {
      resourceType:  rack.resourceType,
      barcode:       rack.labels.barcode.value,
      locations:     _.chain(rack.tubes).map(tubeToCss).object().value()
    };
  }

  var Controller = Object.create(BaseController);

  $.extend(Controller, {
    register: function (callback) {
      callback("reracking_controller", function () {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.owner   = owner;
      this.factory = factory;
      this.config  = config;
      this.model   = Object.create(Model).init(this, config);

      // clean this up!
      this.printerList = _.filter(config.printerList, function(p){
        return p.type === 1;
      });

      this.view = this.createHtml();

      this.subscribeToPubSubEvents();
      return this;
    },

    createHtml: function () {
      var thisController = this;
      this.html = $(_.template(rerackingPartial)(this));

      function validation(element, callback, errorCallback) {
        return function (event) {
          if (event.which !== 13) { return; }
          if (event.currentTarget.value.length === 13) {
            callback(event, element, thisController);
          } else {
            errorCallback(event, element, thisController);
          }
        };
      }

      var scanBarcodeController = this.factory.create("scan_barcode_controller", this).init({type: "labware"});

      this.html.find("#barcodeReader").append(
        this.bindReturnKey(
          scanBarcodeController.renderView(),
          addRackCallback,
          barcodeErrorCallback("Barcode must be a 13 digit number."),
          validation
        )
      );
      this.enableDropzone(this.html);


      this.html.find("#print-rerack-btn").click(_.bind(thisController.onPrintBarcode, thisController));
      this.html.find("#rerack-btn").click(_.bind(thisController.onReracking, thisController));

      this.html.find("#start-rerack-btn").click(_.bind(thisController.onStartReracking, thisController));
      return this.html;

    },

    subscribeToPubSubEvents: function () {
      function resetViewEventHandler() { thisController.reset(); }

      var thisController = this;
      PubSub.subscribe("s2.reception.reset_view", resetViewEventHandler);
    },

    reset: function () {
      this.model.then(function (model) {
        model.reset();
      });
      this.html.find("#rack-list").empty();
      this.html.find("#start-rerack-btn").hide();
      this.rackControllers = [];

      delete this.outputRackController;
      this.html.find(".output-labware").hide();
      this.html.find("#output").hide();
      this.html.find("#print-rerack-btn").hide();


      this.view.find(".validationText").hide();
    },

    enableDropzone: function (html) {
      this.dropzone = DropZone.init(html.find(".dropzone"));
      this.dropzone.enable(_.bind(this.fileUploadedCallback, this));
    },

    disableDropZone: function(){
      this.dropzone.disable();
    },

    // This dropZone callback when a file is received...
    fileUploadedCallback: function (fileContent) {
      var thisController = this;

      return thisController.model
      .then(function (model) {
        thisController.view.find(".validationText").hide();
        thisController.view.trigger("s2.busybox.start_process");
        return model.setFileContent(fileContent);
      })
      .then(function (model) {
        thisController.view.trigger("s2.busybox.end_process");
        thisController.html.find(".output-labware").show();

        thisController.outputRackController = thisController.factory.createLabwareSubController(thisController, "tube_rack");

        var rackRepresentation = {
          resourceType:  "tube_rack",
          barcode:       model.outputRack.labels.barcode.value,
          locations:     _
          .chain(model.tubeMoves.moves)
          .pluck("target_location")
          .reduce(function(memo, location){memo[location] = "full"; return memo;}, {})
          .value()
        };

        thisController.outputRackController.setupController(
          _.build("tube_rack", rackRepresentation),
          function() { return thisController.html.find(".output-labware"); }
        );

        thisController.html.find(".output-labware").empty();
        thisController.outputRackController.renderView();


        // thisController.disableDropZone();
        return thisController;
      },

      function (error) {
        thisController.view.trigger("s2.busybox.end_process");
        thisController.message("error", error.message);
        return error;
      });

    },

    onPrintBarcode: function () {
      var thisController = this;
      this.model
      .then(function (model) {
        var printerName = thisController.view.find("#printer-select").val();

        thisController.view.trigger("s2.busybox.start_process");
        return model.printRackBarcode(printerName);
      })

      .then(function () {
        thisController.view.trigger("s2.busybox.end_process");
        $("#racking-file-upload").collapse({parent: thisController.html});
        return thisController.message("success", "The barcodes have been sent to printer.");
      },
      function (error) {
        thisController.view.trigger("s2.busybox.end_process");
        return thisController.message("error", "Couldn't print the barcodes: " + error);
      });

    },

    onStartReracking: function () {
      $("#rack-labelling").collapse({parent: this.html});
    },

    onReracking: function () {
      var thisController = this;
      this.model
      .then(function (model) {
        thisController.view.trigger("s2.busybox.start_process");
        return model.rerack();
      })
      .fail(function (error) {
        thisController.view.trigger("s2.busybox.end_process");
        return thisController.message(
          "error",
          "Couldn't rerack! Please contact the administrator. " +
            error.message
        );
      })
      .then(function () {
        thisController.view.trigger("s2.busybox.end_process");
        thisController.html.find("#rerack-btn").hide();
        return thisController.message("success", "Reracking completed.");
      });
    },

    message: function (type, message) {
      this.view
      .find(".validationText")
      .show()
      .removeClass("alert-error alert-info alert-success")
      .addClass("alert-" + type)
      .html(message);
    },

    release: function() {},

    childDone: function(){}
  });

  return Controller;

});

