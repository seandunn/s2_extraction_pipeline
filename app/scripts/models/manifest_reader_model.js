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

    reset:function(){
      delete this.json_template_display;
      delete this.samplesForDisplay;
      delete this.samplesFromManifest;
      delete this.combinedData;
      delete this.templateName;
    },

    setFileContent:function(fileContent){
      var deferred = $.Deferred();
      var dataAsArray = CSVParser.manifestCsvToArray(fileContent);
      var templateName = dataAsArray[2][0]; // always A3 !!
      var columnHeaders = dataAsArray[ReceptionTemplate[templateName].header_line_number];
      var sampleAsArray = _.chain(dataAsArray)
          .drop(ReceptionTemplate[templateName].header_line_number+1)
          .filter(function(row){return row[0]})
          .value();
      var combinedData = JsonTemplater.combineHeadersToData(columnHeaders, sampleAsArray);
      if (!ReceptionTemplate[templateName]){
        deferred.reject({message: "Couldn't find the corresponding template!"});
      }
      else if (columnHeaders.length <=1 && columnHeaders[0]){
        deferred.reject({message: "The file contains no header !"});
      }
      else if (combinedData.length <= 0){
        deferred.reject({message: "The file contains no data !"});
      }
      else
      {
        this.json_template_display = ReceptionTemplate[templateName].json_template_display;
        this.samplesForDisplay = JsonTemplater.applyTemplateToDataSet(combinedData, this.json_template_display);
        // we only save the details once we're certain that the data are correct!
        this.combinedData = combinedData;
        this.templateName = templateName;
        deferred.resolve(this);
      }
      return deferred.promise();
    },

    updateSamples:function(){
      var deferred = $.Deferred();
      var thisModel = this;
      thisModel.owner.getS2Root()
        .fail(function () {
            return deferred.reject({message: "Couldn't get the root! Is the server accessible?"});
        })
        .then(function(root){
            // dictionarised using the sanger_sample_id
            var samples = JsonTemplater.applyTemplateToDataSet(thisModel.combinedData, ReceptionTemplate[thisModel.templateName].json_template);
            samples = _.reduce(samples,function(memo,sampleUpdate){
              memo[sampleUpdate.sanger_sample_id] = sampleUpdate;
              delete memo[sampleUpdate.sanger_sample_id].sanger_sample_id;
              return memo
            },{});
            thisModel.samplesFromManifest = {"by":"sanger_sample_id","updates":samples};

            return root.bulk_update_samples.create(thisModel.samplesFromManifest);
        })
        .fail(function () {
          return deferred.reject({message: "Couldn't update the samples on S2."});
        })
        .then(function(){
          return deferred.resolve(thisModel);
        });

      return deferred.promise();
    }
  });
  
  return ReceptionModel;
});
