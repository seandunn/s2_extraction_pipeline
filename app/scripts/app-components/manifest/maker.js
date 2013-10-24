define([
  "text!app-components/manifest/_maker.html",
  "app-components/labelling/printing",

  // Global namespace updates
  "lib/jquery_extensions",
  "components/filesaver/filesaver"
], function (componentPartialHtml, LabelPrinter) {
  'use strict';

  var viewTemplate = _.compose($, _.template(componentPartialHtml));

  return function(context) {
    var view = createHtml(
      context,
      function(details) {
        return context.getS2Root().then(function(root) {
          return GenerateSamples(context, root, details);
        }, _.constant("Couldn't get the root! Is the server accessible?"));
      }
    );

    return {
      name: "maker.manifest.s2",
      view: view,
      events: { "reset_view.reception.s2": _.bind(view.reset, view) }
    };
  };

  function createHtml(context, generateSamples) {
    var html = viewTemplate({
      templates: context.templates
    });

    var message = function(type, message) { html.trigger(type + ".status.s2", message); };
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
    var templatePicker    = html.find("#xls-templates");
    var prefixes          = html.find("#samplePrefixes");
    var dependsOnTemplate = function(f) { return _.compose(f, _.partial(selectedTemplate, context.templates)); };

    templatePicker.change(dependsOnTemplate(_.partial(updateSampleTypeSelection, prefixes)));
    templatePicker.change(dependsOnTemplate(_.partial(updateStudiesSelection, studiesList)));
    templatePicker.change(dependsOnTemplate(_.partial(updatePrinters, html)));
    templatePicker.change();

    // When someone clicks the download button we need to download the manifest.  When the manifest
    // becomes downloadable then the button becomes visible and enabled.
    var download = html.find("#downloadManifest");
    var downloadHelper = download.dataHelper("manifest");
    download.lockingClick(_.partial(downloadManifest, download));
    download.hide();

    // Setup the label printing component so that we can get the labels out.
    var labelPrinter = LabelPrinter({
      printers: context.printers,
      user:     context.user
    });
    var printAreaHelper = labelPrinter.view.dataHelper("resources");
    html.on("trigger.print.s2", $.ignoresEvent(_.partial(printLabels, html, labelPrinter.view)));
    html.find("#printer-div").append(labelPrinter.view);
    html.on(labelPrinter.events);
    labelPrinter.view.hide();

    // Bind in a reset function that we can call
    html.reset = function() {
      printAreaHelper.reset();
      downloadHelper.reset();
      form.prop("disabled", false);
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
        var template = context.templates[templatePicker.val()];
        var study    = template.studies[studiesList.val()];
        return f(button, {
          number_of_labwares:    numberOfSamples,
          template:              template,
          sanger_sample_id_core: study.sanger_sample_id_core,
          sample_type:           prefixes.val(),
          defaults:              study.defaults
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
  }

  // We have to remap the resources so that they look like they are printable.  What we have within
  // our data is the original label data, but what we need is what it would have looked like
  // *after* labelling.
  function printLabels(html, source, printer) {
    var labels = _.map(source.data("resources"), function(resource) {
      return _.extend({
        template:           resource.resourceType,
        returnPrintDetails: function() { return this; }
      }, _.build(
        resource.resourceType,
        _.chain([ean13, sanger, identifier])
         .map(function(f) { return f(resource.labels); })
         .compact()
         .reduce(function(m,a) { return _.extend(m,a); }, {})
         .value()
      ));
    });

    html.trigger("labels.print.s2", [printer, labels]);
  }
  function ean13(labels) {
    return _.isUndefined(labels.ean13) ? undefined : {ean13: labels.ean13};
  }
  function sanger(labels) {
    return _.isUndefined(labels.sanger) ? undefined : {sanger: labels.sanger.prefix+labels.sanger.number+labels.sanger.suffix};
  }
  function identifier(labels) {
    return _.isUndefined(labels.identifier) ? undefined : {identifier: labels.identifier};
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

  function updatePrinters(html, template) {
    html.trigger("filter.print.s2", [function(printer) {
      return printer.canPrint(template.model);
    }]);
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
      function(registerSamples, registerBarcodes, placeSamples, labeller) {
        // We know, up front, how many samples are being created and therefore how many barcodes
        // we're going to need at the end of the process.  Hence, we can perform the bulk sample
        // and bulk barcode creation in parallel.
        var samples  = registerSamples(details, root);
        var barcodes = registerBarcodes(details.sample_type, root);

        return $.when(samples, barcodes).then(function(samples, barcodes) {
          // We can create the labware and label it at the same time as producing the
          // manifest XLS file.

          var data   = placeSamples(samples, barcodes, details.sample_type);
          var blob   = _.toCSV(template.generator.manifest(data, template.extras || {}), ",");

          var manifest  = sendManifestRequest(context, template, blob);
          var resources = createResources(resourceGenerator, root, data).then(_.partial(labelResources, root, model, labeller));

          return $.when(resources, manifest);
        }).then(function(model, manifest) {
          model.manifestBlob = manifest;
          return model;
        });
      }
    );
  }

  // These two functions can run in parallel
  function preRegisterSamples(number, details, root) {
    return root.bulk_create_samples.create(_.extend({
      state:                 "draft",
      quantity:              number,
      sample_type:           details.sample_type,
      sanger_sample_id_core: details.sanger_sample_id_core
    }, details.defaults || {})).then(function(action) {
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
  function labelResources(root, model, labeller, resources) {
    model.labwareOutputs = resources;
    return root.bulk_create_labellables.create({
      labellables: _.map(model.labwareOutputs, _.partial(labellableForResource, labeller))
    }).then(function() {
      return model;
    }, _.constant("Couldn't connect the labware to their labels in S2."));
  }

  function labellableForResource(labeller, resource) {
    return {
      name: resource.uuid,
      type: "resource",
      labels: labeller(resource.labels)
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
        url:  context.app.config.mergeServiceUrl,
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
    var start  = function() { html.trigger("start_process.busybox.s2"); };
    var finish = function() { html.trigger("end_process.busybox.s2"); };

    return function() {
      start();
      return f.apply(this, arguments).always(finish);
    };
  }
});

