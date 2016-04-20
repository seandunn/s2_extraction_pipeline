//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([
  "lib/file_handling/manifests",
  "lib/error",
  "lib/util"
], function(CSV, Errors, Util) {

  "use strict";

  function Manifest(templatesArg, contentArg) {
    var self           = this,
        content        = contentArg,
        templates      = templatesArg,
        contentAsArray = setContentAsArray(content),
        columnHeaders;

    this.set = function(prop, value, options) {
      if (self.hasNoErrors()) {
        self[prop] = value;
        if (options && options.validate === false) {
          return void 0;
        }
        validate(prop, value);
      }
    };

    if (_.isUndefined(contentAsArray)) {
      this.errors.add("The file uploaded does not appear to be a valid manifest.");
      return this;
    }
    
    this.set("template", templates[getTemplateName()]);

    if (!this.hasNoErrors()) {
      return this;
    }
      
    columnHeaders = getColumnHeaders(this.template);

    if (columnHeaders.length <= 1 && columnHeaders[0]) {
      this.errors.add("The file contains no header!");
      return this;
    }

    this.set("model", this.template.model.pluralize(), {validate: false});
    this.set("details", createDetails(contentAsArray, this.template, columnHeaders));

    return this;

    function setContentAsArray(content) {
      return CSV.from(content);
    }

    function getTemplateName() {
      return getCell(2, 0); // Always A3 !!
    }

    function getCell(row, column) {
      return contentAsArray[row][column];
    }

    function createDetails(contentAsArray, template, columnHeaders) {
      return _.chain(contentAsArray)
              .drop(template.manifest.header_line_number + 1)
              .filter(template.emptyRow)
              .map(function(row) { return _.zip(columnHeaders, row); })
              .map(function(pairs) { return _.object(pairs); })
              .map(template.reader.builder)
              .value();
    }

    function getColumnHeaders(template) {
      return getRow(template.manifest.header_line_number);
    }

    function getRow(rowNumber) {
      return contentAsArray[rowNumber];
    }
            
    function validate(prop, value) {
            
      var validations = {

        template: function(val, err) {
          if (_.isUndefined(val)) {
            self.addError("Could not find the corresponding template!");
            return false;
          }
          return true;
        },

        details: function(val, err) {
          if (val.length <= 0) {
            self.addError("The file contains no data!");
            return false;
          }
          return true;
        }
      };

      return validations[prop](value);
    }
  }

  _.extend(Manifest.prototype, Errors.prototype, {
        
    getLabels: function() {
      return _.chain(this.details)
              .indexBy(function(v) {
                return v.label.value;
              })
              .keys()
              .value();
    },

    _getBarcodeField: function() {
      // Ugggghhhhhhhh
      return _.chain(this.template.templates.display)
        .filter(function(fields) {
          return !_.isUndefined(fields.barcode);
        })
        .first()
        .value()
        .barcode
        .columnName;
    },

    getSampleBySangerBarcode: function(sample) {
      var sangerBarcode = sample[this._getBarcodeField()]
      return _.find(this.details, function(detail) { 
        return Util.pad(detail.barcode) === Util.pad(sangerBarcode);
      });
      //return _.findWhere(this.details, { barcode: sangerBarcode });
    },

    getSamples: function() {
      return _.chain(this.details)
              .pluck("row")
              .map(this.template.json_template)
              .value();
    },

    allDetailsInvalid: function() {
      return _.chain(this.details)
              .pluck("invalid")
              .all(_.identity)
              .value();
    },

    detailsHasErrors: function() {
      return _.chain(this.details)
              .pluck("errors")
              .flatten()
              .value()
              .length > 0;
    }
  });
  
  return Manifest;
});
