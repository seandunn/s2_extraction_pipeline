define([
  'models/base_page_model'
  , 'mapper/operations'
  , 'lib/file_handling/manifests'
  , 'lib/json_templater'
  , 'lib/reception_templates'
], function (BasePageModel, Operations, CSVParser, JsonTemplater, ReceptionTemplate) {
  'use strict';

  var ReceptionModel = Object.create(BasePageModel);

  $.extend(ReceptionModel, {

    init: function (owner, config) {
      this.owner = owner;
      this.config = config;
      return this;
    },

    reset: function () {
      this.template = undefined;
      delete this.combinedData;
    },

    setFileContent: function (fileContent) {
      var thisModel   = this;
      var dataAsArray = CSVParser.from(fileContent);

      var templateName = dataAsArray[2][0]; // always A3 !!
      var template     = ReceptionTemplate[templateName];
      if (_.isUndefined(template)) {
        manifestInfo.errors.push("Could not find the corresponding template!");
      }
      var applyTemplate = JsonTemplater.applicator(_.reduce(
        template.json_template_display,
        function(m,v,i) { return _.extend(m,v); },
        {}
      ));

      var columnHeaders = dataAsArray[template.header_line_number];
      if (columnHeaders.length <= 1 && columnHeaders[0]) {
        manifestInfo.errors.push("The file contains no header!");
      }

      var combinedData = JsonTemplater.combineHeadersToData(
        columnHeaders,
        _.chain(dataAsArray).drop(template.header_line_number + 1).filter(_.first).value()
      );

      var tubeDetails    = _.map(combinedData, function(row) {
        return {
          row:      row,
          barcode:  row['Tube Barcode'],
          sample:   row['SANGER SAMPLE ID'],
          resource: undefined,
          errors:   []
        };
      });

      // This is what we are going to fill out: information on each of the tubes (the tube itself but also if there is an
      // issue associated with it), and any global errors (missing barcodes, search errors).
      var manifestInfo = {
        errors: [],
        tubes:  tubeDetails
      };
      if (combinedData.length <= 0) {
        manifestInfo.errors.push("The file contains no data!");
      }

      // Page through all of the tubes from the manifest, checking the information from the manifest against what the
      // system believes should be true.  Once that's done, any tubes that were specified in the manifest but not found
      // in the system should be pushed as errors.  Finally, resolve the search appropriately.
      return this.owner
                 .getS2Root()
                 .then(_.partial(pageThroughTubes, manifestInfo))
                 .then(_.partial(pushMissingTubeErrors, manifestInfo))
                 .then(_.partial(resolveSearch, manifestInfo))
                 .always(_.partial(generateDisplay, manifestInfo, applyTemplate))
                 .always(maintainInformation);

      // TODO: this is 2 functions: save state, resolve
      function maintainInformation() {
        // we only save the details once we're certain that the data are correct!
        thisModel.manifest     = manifestInfo;
        thisModel.combinedData = combinedData;
        thisModel.template     = template;
        return thisModel;
      }
    },

    updateSamples: function (dataFromGUI) {
      // Transform the GUI & manifest data into the same format
      var applyTemplate  = JsonTemplater.applicator(this.template.json_template);
      var samplesFromGUI = _.map(dataFromGUI, _.compose(removeUndefinedKeys, applyTemplate));
      var samples        = _.map(this.combinedData, applyTemplate);
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

      var deferred = $.Deferred();
      var thisModel = this;

      thisModel.owner
               .getS2Root()
               .then(_.partial(updateSamplesInS2, updates))
               .then(function () {
                 return deferred.resolve(thisModel);
               }, function() {
                 return deferred.reject({message: "Couldn't update the samples on S2."});
               });

      return deferred.promise();
    }
  });

  // Search for each of the tubes in the manifest so that we can process them in pages.
  function pageThroughTubes(manifestInfo, root) {
    var deferred = $.Deferred();
    var barcodes = _.pluck(manifestInfo.tubes, 'barcode');

    // WARNING: Paging does not finish when it reaches the end, because the handling is done asynchronously.
    // Therefore we need to resolve only once we reach the end of the handling, and if there are no more
    // pages to come.
    //
    // TODO: Handle failures.  If there are failures during the processing of each page then we need to 
    // collect those errors together somehow.
    root.tubes.searchByBarcode().ean13(barcodes).paged(function(page, hasNext) {
      var promise = $.when.apply(null, _.map(page.entries, _.partial(updateManifestDetails, root, manifestInfo)))
      if (!hasNext) { promise.then(_.bind(deferred.resolve, deferred)); }
    });
    return deferred;
  }

  // Any barcodes that were not found need to be marked as being missing.
  function pushMissingTubeErrors(manifestInfo) {
    _.each(manifestInfo.tubes, function(tube) {
      if (!_.isUndefined(tube.resource)) return;
      tube.errors.push("Cannot find this barcode in the system");
    });
  }

  // If there are any global errors, or any individual tube errors, then we should reject the search.
  function resolveSearch(manifestInfo) {
    var deferred   = $.Deferred();
    var resolution = 'resolve';
    if (manifestInfo.errors.length > 0) {
      resolution = 'reject';
    } else if (_.chain(manifestInfo.tubes).pluck('errors').flatten().value().length > 0) {
      resolution = 'reject';
    }

    return deferred[resolution](manifestInfo);
  }

  function updateManifestDetails(root, manifestInfo, tube) {
    var tubeDetails = _.find(manifestInfo.tubes, function (details) {
      return details.barcode === tube.labels.barcode.value;
    });

    if (_.isUndefined(tubeDetails)) {
      manifestInfo.errors.push("Tube '" + tube.labels.barcode.value + "' is not part of the manifest!");
      return $.Deferred().reject();
    } else {
      tubeDetails.resource = tube;
      return root.samples
                 .find(tube.aliquots[0].sample.uuid)
                 .then(_.partial(checkSample, tubeDetails));
    }
  }

  // Checks the details from the manifest about the sample against the sample that is actually present
  // in the tube in the system.
  function checkSample(tubeDetails, sample) {
    if (sample.sanger_sample_id !== tubeDetails.sample) {
      tubeDetails.errors.push("Should contain '" + sample.sanger_sample_id + "' not '" + tubeDetails.sample + "'");
    }

    var gender = tubeDetails.row['GENDER'];
    if (_.isUndefined(gender) || !_.isString(gender) || (gender.trim() === '')) {
      tubeDetails.errors.push("Gender is invalid");
    }
  }

  function generateDisplay(manifestInfo, template) {
    _.each(manifestInfo.tubes, function(details) {
      details.display = template(details.row);
    });
  }

  // recursively remove undefined keys from this JS object
  function removeUndefinedKeys(object) {
    return _.reduce(object, function (memo, value, key) {
      if ($.isPlainObject(value)) {
        value = removeUndefinedKeys(value);
      }
      if (value && !($.isEmptyObject(value))) {
        memo[key] = value;
      }
      return memo;
    }, {});
  }

  function updateSamplesInS2(updates, root) {
    return root.bulk_update_samples.create({by: "sanger_sample_id", updates: updates});
  }

  function markSampleForPublishing(sample) {
    sample["state"] = "published";
    return sample;
  }

  return ReceptionModel;
});
