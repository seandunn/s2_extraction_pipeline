define([
  'extraction_pipeline/models/base_page_model'
  , 'mapper/operations'
  , 'extraction_pipeline/lib/csv_parser'
  , 'extraction_pipeline/lib/json_templater'
  , 'extraction_pipeline/lib/reception_templates'
], function (BasePageModel, Operations, CSVParser, JsonTemplater, ReceptionTemplate) {
  'use strict';

  var ReceptionModel = Object.create(BasePageModel);

  $.extend(ReceptionModel, {

    init: function (owner, config) {
      this.owner = owner;
      this.config = config;
      return $.Deferred().resolve(this).promise();
    },

    reset: function () {
      delete this.json_template_display;
      delete this.samplesForDisplay;
      delete this.samplesFromManifest;
      delete this.combinedData;
      delete this.templateName;
    },

    setFileContent: function (fileContent) {
      var deferred = $.Deferred();
      var dataAsArray = CSVParser.manifestCsvToArray(fileContent);
      var templateName = dataAsArray[2][0]; // always A3 !!
      var columnHeaders = dataAsArray[ReceptionTemplate[templateName].header_line_number];
      var sampleAsArray = _.chain(dataAsArray)
          .drop(ReceptionTemplate[templateName].header_line_number + 1)
          .filter(function (row) {
            return row[0]
          })
          .value();
      var combinedData = JsonTemplater.combineHeadersToData(columnHeaders, sampleAsArray);
      if (!ReceptionTemplate[templateName]) {
        deferred.reject({message: "Couldn't find the corresponding template!"});
      }
      else if (columnHeaders.length <= 1 && columnHeaders[0]) {
        deferred.reject({message: "The file contains no header !"});
      }
      else if (combinedData.length <= 0) {
        deferred.reject({message: "The file contains no data !"});
      }
      else {
        this.json_template_display = ReceptionTemplate[templateName].json_template_display;
        this.samplesForDisplay = JsonTemplater.applyTemplateToDataSet(combinedData, this.json_template_display);
        // we only save the details once we're certain that the data are correct!
        this.combinedData = combinedData;
        this.templateName = templateName;
        deferred.resolve(this);
      }
      return deferred.promise();
    },

    updateSamples: function (dataFromGUI) {
      var deferred = $.Deferred();
      var thisModel = this;
      thisModel.owner.getS2Root()
          .fail(function () {
            return deferred.reject({message: "Couldn't get the root! Is the server accessible?"});
          })
          .then(function (root) {
            // transforms the data extracted from the GUI according to the template format + cleanup of the undefined keys
            var samplesFromGUI = _.map(JsonTemplater.applyTemplateToDataSet(dataFromGUI, ReceptionTemplate[thisModel.templateName].json_template),
                function (sample) {
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
                  return removeUndefinedKeys(sample);
                });
            // extracts the IDs of the selected tubes, allowing us to filter the file data
            var selectedSampleSangerIDs = _.pluck(samplesFromGUI,'sanger_sample_id');
            // transforms the data extracted from the file according to the template format
            var samples = JsonTemplater.applyTemplateToDataSet(thisModel.combinedData, ReceptionTemplate[thisModel.templateName].json_template);
            // merges both data set and transforms into a dictionary
            samples = _.chain(samples)
                .filter(function(sample){
                  // filters the file data to only retains the selected tubes in the GUI
                  return _.contains(selectedSampleSangerIDs,sample.sanger_sample_id);
                })
                .zip(samplesFromGUI)
                .map(function (pair) {
                  // merges the GUI and File data
                  return $.extend(pair[0], pair[1]);
                })
                .reduce(function (memo, sampleUpdate) {
                  // dictionarised using the sanger_sample_id
                  memo[sampleUpdate.sanger_sample_id] = sampleUpdate;
                  memo[sampleUpdate.sanger_sample_id]["state"]= "published";
                  delete memo[sampleUpdate.sanger_sample_id].process; // TODO: remove this line when S2 will be able to handle the process parameter
                  delete memo[sampleUpdate.sanger_sample_id].sanger_sample_id;
                  return memo
                }, {})
                .value();
            // makes the update request
            return root.bulk_update_samples.create({"by": "sanger_sample_id", "updates": samples});
          })
          .fail(function () {
            return deferred.reject({message: "Couldn't update the samples on S2."});
          })
          .then(function () {
            return deferred.resolve(thisModel);
          });

      return deferred.promise();
    }
  });

  return ReceptionModel;
});
