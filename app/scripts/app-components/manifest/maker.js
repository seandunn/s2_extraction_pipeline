define([
  "text!app-components/manifest/_maker.html",
  "lib/reception_templates",
  "models/base_page_model",

  // Global namespace updates
  "lib/jquery_extensions",
  "components/filesaver/filesaver"
], function (componentPartialHtml, ReceptionTemplates, BasePageModel) {
  'use strict';

  return function(context) {
    var view = createHtml(
      ReceptionTemplates,
      context.config.printers,
      function(details) {
        return context.getS2Root().then(function(root) {
          return GenerateSamples(context, root, details);
        }, _.constant("Couldn't get the root! Is the server accessible?"));
      }
    );

    return {
      view: view,
      events: { "s2.reception.reset_view": _.bind(view.reset, view) }
    };
  };

  function createHtml(templates, printers, generateSamples) {
    var html = $(_.template(componentPartialHtml)({
      templates: templates,
      printers:  printers
    }));

    var messageView = html.find(".validationText");
    var message     = function(type, message) {
      messageView.removeClass("alert-error alert-info alert-success")
                 .addClass("alert-"+type)
                 .html(message)
                 .show();
    };

    var error   = _.partial(message, "error");
    var success = _.partial(message, "success");

    // Handle the manifest generation
    var generate    = html.find("#generateManifest");
    var sampleCount = html.find("#number-of-sample");
    var studiesList = html.find("#studies");
    var form        = html.find("form .template-selection-box").find("input,select");

    generate.lockingClick(_.partial(checkSamples, process(html, generateManifest)));
    sampleCount.enterHandler(_.bind(generate.click, generate));

    // When someone changes the template we need to change the view!
    var templatePicker = html.find("#xls-templates");
    var prefixes       = html.find("#samplePrefixes");
    templatePicker.change(_.compose(_.partial(updateSampleTypeSelection, prefixes), _.partial(selectedTemplate, templates)));
    templatePicker.change(_.compose(_.partial(updateStudiesSelection, studiesList), _.partial(selectedTemplate, templates)));
    templatePicker.change();

    // When someone clicks the download button we need to download the manifest.  When the manifest
    // becomes downloadable then the button becomes visible and enabled.
    var download = html.find("#downloadManifest");
    var downloadHelper = download.dataHelper("manifest");
    download.lockingClick(_.partial(downloadManifest, download));
    download.hide();

    // Handle barcode label printing.
    var printArea = html.find("#printer-div");
    var printAreaHelper = printArea.dataHelper("resources");
    var printers  = printArea.find("select");
    printArea.find("button").lockingClick(process(html, _.partial(printBarcodes, printers, printArea)));
    printArea.hide();

    // Bind in a reset function that we can call
    html.reset = function() {
      printAreaHelper.reset();
      downloadHelper.reset();
      form.prop("disabled", false);
      messageView.hide();
    };

    return html;

    function checkSamples(f, button) {
      var numberOfSamples = parseInt(sampleCount.val());
      if (_.isNaN(numberOfSamples)) {
        button.prop("disabled", false);
        error("The number of samples is not valid.");
      } else if (numberOfSamples < 1) {
        button.prop("disabled", false);
        error("You can only register 1 or more samples!");
      } else {
        var template = templates[templatePicker.val()];
        return f(button, {
          number_of_labwares:    numberOfSamples,
          template:              template,
          sanger_sample_id_core: template.studies[studiesList.val()].sanger_sample_id_core,
          sample_type:           prefixes.val()
        });
      }
    }

    function generateManifest(button, details) {
      form.prop("disabled", true);
      button.hide();
      return generateSamples(details).then(function(model) {
        printAreaHelper.resources(model.labwareOutputs);
        downloadHelper.manifest(model.manifestBlob).element.click();

        return success("Samples generated and manifest saved. Barcodes ready for printing.");
      });
    }

    function printBarcodes(printers, source, button) {
      // We have to remap the resources so that they look like they are printable.  What we have within
      // our data is the original label data, but what we need is what it would have looked like
      // *after* labelling.
      var labels = _.map(source.data("resources"), function(resource) {
        return _.extend({
          template:           resource.resourceType,
          returnPrintDetails: function() { return this; }
        }, _.build(resource.resourceType, {
          ean13:  resource.labels.ean13,
          sanger: resource.labels.sanger.prefix + resource.labels.sanger.number + resource.labels.sanger.suffix
        }));
      });

      return BasePageModel.printBarcodes(labels, printers.val())
                          .then(function() {
                            return success("The barcodes have been sent to the printer!");
                          }, function() {
                            return error("Could not print the barcodes");
                          }).always(function() {
                            button.prop("disabled", false);
                          });
    }
  }

  function selectedTemplate(templates, event) {
    return templates[$(event.target).val()];
  }

  function updateSampleTypeSelection(select, template) {
    select.html(_.map(
      template.sample_types,
      function(value, key) { return "<option value=\""+key+"\">" + key + "</option>"; }
    ));
  }

  function updateStudiesSelection(select, template) {
    select.html(_.map(
      template.studies,
      function(value, key) { return "<option value=\"" + key + "\">" + value.friendly_name + "</option>"; }
    ));
  }

  function downloadManifest(source, button) {
    saveAs(source.data("manifest"), "manifest.xls");
    button.prop("disabled", false);
  }

  function GenerateSamples(context, root, details) {
    var model             = {};
    var template          = details.template;
    var resourceGenerator = _.partial(template.generator.resources, template.sample_types[details.sample_type]);

    return template.generator.prepare(
      preRegisterSamples,
      preRegisterBarcodes,
      details.number_of_labwares,
      function(registerSamples, registerBarcodes, placeSamples) {
        // We know, up front, how many samples are being created and therefore how many barcodes
        // we're going to need at the end of the process.  Hence, we can perform the bulk sample
        // and bulk barcode creation in parallel.
        var samples  = registerSamples(details.sample_type, details.sanger_sample_id_core, root);
        var barcodes = registerBarcodes(details.sample_type, root);

        return $.when(samples, barcodes).then(function(samples, barcodes) {
          // We can create the labware and label it at the same time as producing the
          // manifest XLS file
          var data      = placeSamples(samples, barcodes, details.sample_type);
          var blob      = _.toCSV(template.generator.manifest(data), ",");

          var manifest  = sendManifestRequest(context, template, blob);
          var resources = createResources(resourceGenerator, root, data).then(_.partial(labelResources, root, model));

          return $.when(resources, manifest);
        }).then(function(model, manifest) {
          model.manifestBlob = manifest;
          return model;
        });
      }
    );
  }

  // These two functions can run in parallel
  function preRegisterSamples(number, type, core, root) {
    return root.bulk_create_samples.create({
      state:                 "draft",
      quantity:              number,
      sample_type:           type,
      sanger_sample_id_core: core
    }).then(function(action) {
      return action.result.samples;
    }, _.constant("Could not pre-register " + number + " samples in S2."));
  }
  function preRegisterBarcodes(number, model, type, root) {
    return root.bulk_create_barcodes.create({
      number_of_barcodes: number,
      labware:            model,
      role:               "stock",
      contents:           type
    }).then(function(action) {
      return action.result.barcodes;
    }, _.constant("Could not pre-register " + number + " barcodes in S2."));
  }
  function labelResources(root, model, resources) {
    model.labwareOutputs = resources;
    return root.bulk_create_labellables.create({
      labellables: _.map(model.labwareOutputs, labellableForResource)
    }).then(function() {
      return model;
    }, _.constant("Couldn't connect the labware to their labels in S2."));
  }

  function labelForBarcode(barcode) {
    return {
      barcode:        {
        type:  "ean13-barcode",
        value: barcode.ean13
      },
      "sanger label": {
        type:  "sanger-barcode",
        value: barcode.sanger.prefix + barcode.sanger.number + barcode.sanger.suffix
      }
    };
  }

  function labellableForResource(resource) {
    return {
      name: resource.uuid,
      type: "resource",
      labels: labelForBarcode(resource.labels)
    };
  }

  function sendManifestRequest(context,template,csv) {
    return $.binaryAjax({
      type: "GET",
      url:  template.manifest.path,
    }).then(function(xls) {
      // Encode the data in such a way that we get a multi-part MIME body, otherwise all we
      // get is form data which doesn't work with the manifest merge service.
      var form = new FormData();
      form.append("template",         xls);
      form.append("manifest-details", new Blob([csv], {type:"text/csv"}));

      return $.binaryAjax({
        type: "POST",
        url:  context.config.mergeServiceUrl,
        data: form
      });
    }).fail(_.constant("Unable to generate the manifest"));
  }

  function createResources(helper, root, manifest) {
    return helper(function(model, sampleFor, prepareRequest) {
      var sampleBarcodes =
        _.chain(manifest)
         .map(function(r) { return [r[0].uuid, r[1]]; })
         .object()
         .value();

      var builder = _.compose(
        function(resource) {
          resource.labels = sampleBarcodes[sampleFor(resource).uuid];
          return resource;
        },
        function(raw) {
          return root[model].instantiate(_.build("rawJson", model.singularize(), raw));
        }
      );

      // Remove any temporary information that might have been stored in the data for creation.
      // Creating plates does this because it needs barcodes to group samples correctly.
      var data   = _.reduce(manifest, prepareRequest, []);
      var fields = _.chain(data).map(_.keys).flatten().uniq().filter(function(v) { return v[0] === "_"; }).value();

      return root["bulk_create_" + model].create(
        _.build(model, _.map(data, function(o) { return _.omit(o, fields); }))
      ).then(function(bulk) {
        return _.map(bulk.result[model], builder);
      }, _.constant("Could not register the labware"));
    });
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

