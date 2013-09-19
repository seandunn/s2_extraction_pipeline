define([
  'models/base_page_model'
  , 'mapper/operations'
  , 'lib/file_handling/manifests'
  , 'lib/reception_templates'
], function (BasePageModel, Operations, CSVParser, ReceptionTemplate) {
  'use strict';

  // These functions deal with pairing the details from the manifest with the sample UUID in the
  // resource passed.  In the case of the tube it can be assumed tht the first aliquot is the one
  // we're after; in the case of a plate we look at the well at the location specified in the
  // manifest details.
  var AliquotExtractors = {
    tubes:      sampleFromContainer,
    plates:     plateLikeExtractor('wells'),
    tube_racks: plateLikeExtractor('tubes')
  };

  function plateLikeExtractor(receptacles) {
    return function(container, details) {
      return sampleFromContainer(container[receptacles][details.row['LOCATION']]);
    };
  }
  function sampleFromContainer(receptacle) {
    if (_.isEmpty(receptacle.aliquots)) {
      return undefined;
    } else if (_.isUndefined(receptacle.aliquots[0].sample)) {
      return undefined;
    } else {
      return receptacle.aliquots[0].sample.uuid;
    }
  }

  var ReceptionModel = Object.create(BasePageModel);

  $.extend(ReceptionModel, {

    init: function (owner, config) {
      this.owner = owner;
      this.config = config;
      return this;
    },

    reset: function () {
      this.manifest = undefined;
    },

    setFileContent: function (fileContent) {
      // This is what we are going to fill out: information on each of the samples (the resource itself but also if there is an
      // issue associated with it), and any global errors (missing barcodes, search errors).
      this.manifest = {
        template: undefined,
        errors:   [],
        details:  []
      };
      var resolver = _.partial(resolveSearch, this.manifest);

      var dataAsArray = CSVParser.from(fileContent);
      if (_.isUndefined(dataAsArray)) {
        this.manifest.errors.push("The file uploaded does not appear to be a valid manifest.");
        return resolver();
      }

      var templateName       = dataAsArray[2][0]; // always A3 !!
      this.manifest.template = ReceptionTemplate[templateName];
      if (_.isUndefined(this.manifest.template)) {
        this.manifest.errors.push("Could not find the corresponding template!");
        return resolver();
      }
      this.manifest.model = this.manifest.template.model.pluralize();

      var columnHeaders = dataAsArray[this.manifest.template.header_line_number];
      if (columnHeaders.length <= 1 && columnHeaders[0]) {
        this.manifest.errors.push("The file contains no header!");
        return resolver();
      }

      this.manifest.details =
        _.chain(dataAsArray)
         .drop(this.manifest.template.header_line_number+1)
         .filter(_.first)
         .map(function(row) { return _.zip(columnHeaders, row); })
         .map(function(pairs) { return _.object(pairs); })
         .map(buildDetailsForRow)
         .value();

      if (this.manifest.details.length <= 0) {
        this.manifest.errors.push("The file contains no data!");
      }

      // Page through all of the resources from the manifest, checking the information from the manifest against what the
      // system believes should be true.  Once that's done, any resources that were specified in the manifest but not found
      // in the system should be pushed as errors.  Finally, resolve the search appropriately.
      var deferred =
        this.owner
            .getS2Root()
            .then(_.partial(pageThroughResources, this.manifest))
            .then(_.partial(pushMissingResourceErrors, this.manifest));
      return _.regardless(deferred, resolver);
    },

    updateSamples: function (dataFromGUI) {
      // Transform the GUI & manifest data into the same format
      var samplesFromGUI = _.map(dataFromGUI, _.compose(removeUndefinedKeys, this.manifest.template.json_template));
      var samples        = _.map(_.pluck(this.manifest.details, 'row'), this.manifest.template.json_template);
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

  // Search for each of the resources in the manifest so that we can process them in pages.  Each page is
  // handled individually, with the entries on the page being handled sequentially.  Therefore, rather
  // than having 1000 simultaneous requests, we get 10 simultaneous requests that are 100 sequential
  // requests.  This should reduce the load on the browser.
  function pageThroughResources(manifest, root) {
    var barcodes  = _.chain(manifest.details).indexBy('barcode').keys().value();
    var extractor = AliquotExtractors[manifest.model];
    var promises  = [];
    return root[manifest.model].searchByBarcode().ean13(barcodes).paged(function(page, hasNext) {
      if (page.entries.length == 0) return;
      promises.push(chain(_.map(page.entries, promiseHandler), _.regardless));
    }).then(function() {
      // Normally we would use '$.when' here but the problem is that we want to wait for all promises
      // to finish, regardless of their reject/resolve status.  $.when will reject immediately upon
      // *one* of the promises being rejected.
      return waitForAllPromises(promises);
    })

    function promiseHandler(resource) {
      return function() {
        return updateManifestDetails(root, manifest, extractor, resource);
      };
    }
  }

  function updateManifestDetails(root, manifest, extractor, resource) {
    var details = _.filter(manifest.details, function (details) {
      return details.barcode === resource.labels.barcode.value;
    });

    if (_.isEmpty(details)) {
      manifest.errors.push("Barcode '" + resource.labels.barcode.value + "' is not part of the manifest!");
      return $.Deferred().reject();
    } else {
      details.resource = resource;

      // Pair up each of the details with the samples that are in the resource.  Then we can lookup
      // the associated sample and check it against the details.
      var sampleUuid = _.compose(_.partial(extractor, resource), sampleFromContainer);
      return waitForAllPromises(
        _.chain(details)
         .map(function(details) { return [details,sampleUuid(details)]; })
         .map(_.partial(validateSampleDetails, root, manifest))
         .value()
      );
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

  function chain(handlers, chaining) {
    if (handlers.length == 0) return;   // It's fair to assume this is an immediate return of undefined!

    var args = _.drop(arguments, 2);
    return _.chain(handlers).drop(1).reduce(chaining, handlers[0].apply(handlers[0], args)).value();
  }
  function waitForAllPromises(promises) {
    return chain(_.map(promises, _.partial(_.partial, _.identity)), _.regardless);
  }

  function buildDetailsForRow(row) {
    return {
      row:      row,
      barcode:  row['Tube Barcode'],
      sample:   row['SANGER SAMPLE ID'],
      resource: undefined,
      errors:   []
    };
  }

  return ReceptionModel;
});
