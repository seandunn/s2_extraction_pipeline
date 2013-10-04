define([
    'text!app-components/manifest/_reader.html'
  , 'text!app-components/manifest/_row.html'
  , 'lib/file_handling/manifests'
  , 'app-components/dropzone/component'

  // Loaded in the global namespace after this comment
  , 'lib/jquery_extensions'
], function (componentPartialHtml, sampleRowPartial, CSVParser, DropZone) {
  'use strict';

  var viewTemplate = _.compose($, _.template(componentPartialHtml));
  var rowTemplate  = _.template(sampleRowPartial);

  // Functions that generate will display a particular value based on the type it should be.
  var CellTemplates = {
    select: templateHelper(function(cell, value) {
      return $("<select/>").append(_.map(cell.options, option));

      function option(option) {
        var details = {value: option.trim(), text: option.trim()};
        if (details.value.toUpperCase() === value.trim().toUpperCase()) {
          details["selected"] = "selected";
        }
        return $("<option></option>", details);
      }
    }),

    checkbox: templateHelper(function(cell, value) {
      var checkbox = $("<input type='checkbox' />");
      if (value) { checkbox.attr('checked', 'checked'); }
      return checkbox;
    }),

    span: templateHelper(function(cell, value) {
      return $("<span />").text(value);
    })
  };

  // Functions that, given an element in the order view, will extract the value based on the type it should be.
  var Extractors = {
    checkbox: function(element) { return element.find("input:checkbox:first").is(":checked"); },
    select:   function(element) { return element.find("select:first").val(); },
    span:     function(element) { return element.find("span:first").text(); }
  };

  return function(context) {
    var view = createHtml(context);
    return {
      view: view,
      events: { "s2.reception.reset_view": _.bind(view.reset, view) }
    };
  };

  function createHtml(context) {
    var html = viewTemplate();

    var message        = function(type, message) { html.trigger("s2.status." + type, message); };
    var error          = _.partial(message, "error");
    var success        = _.partial(message, "success");
    var manifestErrors = function(manifest) { _.each(manifest.errors, error); return manifest; }

    // saves the selection for performances
    var manifestTable      = html.find(".orderMaker");
    var registration       = html.find("#registrationBtn").hide();
    var registrationHelper = registration.dataHelper("manifest");

    // Configure and establish the dropzone
    var dropzone = DropZone({
      mime: "text/csv",
      message: "Drop the manifest CSV file here, or click to select."
    });
    html.find(".dropzone").append(dropzone.view).on(dropzone.events);
    html.on("dropzone.file", process(html, warningButton(registration, hideUnhide(dropzone.view, function(event, content) {
      return dropZoneLoad(context, registration, manifestTable, content).then(
        _.bind(registrationHelper.manifest, registrationHelper),
        manifestErrors
      );
    }))));

    registration.lockingClick(process(html, hideUnhide(dropzone.view, function(source) {
      return createOrder(context, manifestTable, source.data("manifest")).then(
        success,
        error
      );
    })));

    _.extend(html, {
      reset: function() {
        dropzone.view.show();
        registration.hide();
        manifestTable.empty();
      }
    });
    return html;
  }

  // Functions handling the toggling of rows.
  function nearestRow(event) {
    return $(event.target).closest("tr");
  }
  function disableRow(tr) {
    tr.find("select,input").attr("disabled", true);
    tr.removeClass("success");
    return tr;
  }
  function enableRow(tr) {
    tr.find("select,input").attr("disabled", false);
    tr.addClass("success");
    return tr;
  }
  function enableRowSelector(tr) {
    tr.find("input[data-name_of_column='_SELECTED']").attr("disabled",false);
  }

  // Functions handling the generation of view components.
  function normalView(content) {
    return CellTemplates[content.type || 'span'](content);
  }
  function errorView(element) {
    $(element, "select,input").attr("disabled", true);
    return element;
  }
  function elementToHtml(element) {
    return element.wrap("<div/>").parent().html();
  }

  // Some utility functions for dealing with processes
  function displayManifest(registerButton, makeOrderButton, manifest) {
    registerButton.show();
    createSamplesView(makeOrderButton, manifest);
    return manifest;
  }

  // View related functions
  function updateDisplay(transform, details) {
    details.display = transform(details.row);
    return details;
  }
  function generateView(details) {
    var viewCreators = [normalView];
    if (details.errors.length > 0) viewCreators.unshift(errorView);
    viewCreators.unshift(elementToHtml);
    details.views = _.map(details.display, _.compose.apply(undefined, viewCreators));
    return details;
  }

  function createSamplesView(view, manifest) {
    // Generate the display and then render the view
    var data = { headers: [], manifest: manifest };
    if (manifest.template) {
      _.each(manifest.details, _.compose(generateView, _.partial(updateDisplay, manifest.template.json_template_display)));
      data.headers = _.map(manifest.details[0].display, function(c) { return c.friendlyName || c.columnName; });
    }
    view.append(rowTemplate(data));

    // Deal with checking & unchecking rows for orders
    view.delegate(
      "input[data-name_of_column='_SELECTED']:checked",
      "click",
      _.compose(enableRowSelector, enableRow, nearestRow)
    ).delegate(
      "input[data-name_of_column='_SELECTED']:not(:checked)",
      "click",
      _.compose(enableRowSelector, disableRow, nearestRow)
    );

    view.show();
  }

  function dropZoneLoad(context, registerButton, manifestTable, fileContent) {
    var deferred = $.Deferred();

    // Remove the previous results
    manifestTable.empty();
    return setFileContent(context, fileContent).always(
      _.partial(displayManifest, registerButton, manifestTable)
    ).then(
      _.partial(success, deferred),
      _.partial(failure, deferred)
    );

    function failure(deferred, value) {
      deferred.reject("There are errors with the manifest. Fix these or proceed with caution!");
      return value;
    }
    function success(deferred, value) {
      deferred.resolve(value);
      return value;
    }
  }

  function createOrder(context, manifestTable, manifest) {
    var extractors =
      _.chain(manifest.details[0].display)
       .pluck('type')
       .map(buildExtractor)
       .value();

    var data =
      manifestTable.find("tbody tr.success")
                   .map(function() {
                     return _.chain(extractors)
                             .zip($(this).find("td"))
                             .map(function(p) { return p[0](p[1]); })
                             .compact()
                             .object()
                             .value();
                   });
    return context.getS2Root().then(_.partial(updateSamples, manifest, data));
  }

  function buildExtractor(type) {
    var extractor = Extractors[type || 'span'];

    return function(element) {
      element = $(element);

      var data = element.find(":first").data();
      if (_.isUndefined(data)) return undefined;
      return [data.name_of_column, extractor(element)];
    };
  }

  // TODO: move this into underscore templates
  function templateHelper(callback) {
    return function(cell) {
      var value   = cell.value || cell.default;
      var element = callback(cell, value);
      return element.addClass(cell.class)
                    .attr("data-name_of_column", cell.columnName);
    };
  }

  function setFileContent(context, fileContent) {
    // This is what we are going to fill out: information on each of the samples (the resource itself but also if there is an
    // issue associated with it), and any global errors (missing barcodes, search errors).
    var manifest = {
      template: undefined,
      errors:   [],
      details:  []
    };
    var resolver = _.partial(resolveSearch, manifest);

    var dataAsArray = CSVParser.from(fileContent);
    if (_.isUndefined(dataAsArray)) {
      manifest.errors.push("The file uploaded does not appear to be a valid manifest.");
      return resolver();
    }

    var templateName       = dataAsArray[2][0]; // always A3 !!
    manifest.template = context.templates[templateName];
    if (_.isUndefined(manifest.template)) {
      manifest.errors.push("Could not find the corresponding template!");
      return resolver();
    }
    manifest.model = manifest.template.model.pluralize();

    var columnHeaders = dataAsArray[manifest.template.manifest.header_line_number];
    if (columnHeaders.length <= 1 && columnHeaders[0]) {
      manifest.errors.push("The file contains no header!");
      return resolver();
    }

    manifest.details =
      _.chain(dataAsArray)
       .drop(manifest.template.manifest.header_line_number+1)
       .filter(_.first)
       .map(function(row) { return _.zip(columnHeaders, row); })
       .map(function(pairs) { return _.object(pairs); })
       .map(manifest.template.reader.builder)
       .value();

    if (manifest.details.length <= 0) {
      manifest.errors.push("The file contains no data!");
    }

    // Page through all of the resources from the manifest, checking the information from the manifest against what the
    // system believes should be true.  Once that's done, any resources that were specified in the manifest but not found
    // in the system should be pushed as errors.  Finally, resolve the search appropriately.
    var deferred =
      context.getS2Root()
             .then(_.partial(pageThroughResources, manifest))
             .then(_.partial(pushMissingResourceErrors, manifest));
    return _.regardless(deferred, resolver);
  }

  function updateSamples(manifest, dataFromGUI, root) {
    // Transform the GUI & manifest data into the same format
    var samplesFromGUI = _.map(dataFromGUI, _.compose(_.removeUndefinedKeys, manifest.template.json_template));
    var samples        = _.map(_.pluck(manifest.details, 'row'), manifest.template.json_template);
    var lookup         = _.partial(_.findBy, 'sanger_sample_id', samples);

    // Pair up the samples selected in the GUI with their manifest partners.  Merge the
    // former into the latter and mark the new sample as published.  Then build an
    // object that details the updates to perform.
    var updates =
      _.chain(samplesFromGUI)
       .pairwise(lookup)
       .map(function(pair) { return _.deepMerge.apply(undefined, pair); })
       .map(markSampleForPublishing)
       .map(function(sample) { return [sample.sanger_sample_id, _.omit(sample,'sanger_sample_id')]; })
       .object()
       .value();

    return root.bulk_update_samples
               .create({by: "sanger_sample_id", updates: updates})
               .then(_.constant("Samples successfully updated."), _.constant("Could not update the samples in S2."));
  }

  // Search for each of the resources in the manifest so that we can process them in pages.  Each page is
  // handled individually, with the entries on the page being handled sequentially.  Therefore, rather
  // than having 1000 simultaneous requests, we get 10 simultaneous requests that are 100 sequential
  // requests.  This should reduce the load on the browser.
  function pageThroughResources(manifest, root) {
    var barcodes  = _.chain(manifest.details).indexBy('barcode').keys().value();
    var promises  = [];
    return root[manifest.model].searchByBarcode().ean13(barcodes).paged(function(page, hasNext) {
      if (page.entries.length == 0) return;
      promises.push($.chain(_.map(page.entries, promiseHandler), _.regardless));
    }).then(function() {
      // Normally we would use '$.when' here but the problem is that we want to wait for all promises
      // to finish, regardless of their reject/resolve status.  $.when will reject immediately upon
      // *one* of the promises being rejected.
      return $.waitForAllPromises(promises);
    })

    function promiseHandler(resource) {
      return function() {
        return updateManifestDetails(root, manifest, resource);
      };
    }
  }

  function updateManifestDetails(root, manifest, resource) {
    var details = 
      _.chain(manifest.details)
       .filter(function(details) { return details.barcode === resource.labels.barcode.value; })
       .map(function(details) { details.resource = resource; return details; })
       .value();

    if (_.isEmpty(details)) {
      manifest.errors.push("Barcode '" + resource.labels.barcode.value + "' is not part of the manifest!");
      return $.Deferred().reject();
    } else {
      // Pair up each of the details with the samples that are in the resource.  Then we can lookup
      // the associated sample and check it against the details.
      var sampleUuid = _.compose(sampleFromContainer, _.partial(manifest.template.reader.extractor, resource));
      return $.waitForAllPromises(
        _.chain(details)
         .map(function(details) { return [details,sampleUuid(details)]; })
         .map(_.partial(validateSampleDetails, root, manifest))
         .value()
      );
    }
  }
  function sampleFromContainer(aliquots) {
    if (_.isEmpty(aliquots)) {
      return undefined;
    } else if (_.isUndefined(aliquots[0].sample)) {
      return undefined;
    } else {
      return aliquots[0].sample.uuid;
    }
  }

  function validateSampleDetails(root, manifest, pair) {
    var details = pair[0], uuid = pair[1];
    if (_.isUndefined(uuid)) {
      details.errors.push("Does not appear to be part of the labware!");
      return $.Deferred().reject(details);
    } else {
      return root.samples
                 .find(uuid)
                 .then(_.partial(checkSample, details))
                 .then(manifest.template.validation);
    }
  }

  // Any barcodes that were not found need to be marked as being missing.
  function pushMissingResourceErrors(manifest, value) {
    _.each(manifest.details, function(details) {
      if (!_.isUndefined(details.resource)) return;
      details.errors.push("Cannot find this barcode in the system");
    });
    return value;
  }

  // If there are any global errors, or any individual resource errors, then we should reject the search.
  function resolveSearch(manifest) {
    var deferred   = $.Deferred();
    var resolution = 'resolve';
    if (manifest.errors.length > 0) {
      resolution = 'reject';
    } else if (_.chain(manifest.details).pluck('errors').flatten().value().length > 0) {
      resolution = 'reject';
    }

    return deferred[resolution](manifest);
  }

  // Checks the details from the manifest about the sample against the sample that is actually present
  // in the resource in the system.
  function checkSample(details, sample) {
    if (sample.sanger_sample_id !== details.sample) {
      details.errors.push("Should contain '" + sample.sanger_sample_id + "' not '" + details.sample + "'");
    }

    var gender = details.row['GENDER'];
    if (_.isUndefined(gender) || !_.isString(gender) || (gender.trim() === '')) {
      details.errors.push("Gender is invalid");
    }
    return details;
  }

  function markSampleForPublishing(sample) {
    sample["state"] = "published";
    return sample;
  }

  function warningButton(button, f) {
    return function() {
      button.hide();
      return f.apply(this, arguments).then(function() {
        button.removeClass("btn-warning").prop("disabled", false);
      }, function(value) {
        if (value.errors.length > 0) { button.hide(); }
        button.addClass("btn-warning");
      });
    };
  }

  function hideUnhide(element, f) {
    return function() {
      element.hide();
      return f.apply(this, arguments).fail(_.bind(element.show, element));
    };
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

