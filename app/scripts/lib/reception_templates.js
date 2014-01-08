define([
  'lib/reception_templates/generators',
  'lib/reception_templates/readers',
  'lib/underscore_extensions',

  // Add new templates after this comment and they will be automatically loaded
  'reception_templates/cgap_lysed',
  'reception_templates/hmdmc_lysed',
  'reception_templates/general_plate',
  'reception_templates/filter_paper',
  'reception_templates/blood_manifest'
], function (Generators, Readers) {
  'use strict';

  var templateTransform = _.identity;
  var displayTransform  = function(json) {
    return _.reduce(json, function(m,v,i) { return _.extend(m,v); }, {});
  };

  /*
   * Converters.  These map between raw values and their manifest counterparts.
   */
  var identityConverter = {
    manifestToRaw: _.identity,
    rawToManifest: _.identity
  };

  var intConverter = {
    manifestToRaw: function(value) {
      value = parseInt(value, 10);
      return isNaN(value) ? undefined : value;
    },
    rawToManifest: _.identity
  };

  var floatConverter = {
    manifestToRaw: parseFloat,
    rawToManifest: _.identity
  };

  var booleanConverter = {
    manifestToRaw: function(value) {
      var upped = (value || 'NO').toUpperCase();
      return (upped === 'YES') || (upped === 'TRUE') || (upped === 'Y');
    },
    rawToManifest: function(value) {
      return value ? "Yes" : "No";
    }
  };

  var ean13BarcodeConverter = {
    manifestToRaw: function(value) {
      return _.str.isBlank(value) ? undefined : _.str.lpad(""+intConverter.manifestToRaw(value), 13, "0");
    },
    rawToManifest: _.identity
  };

  return _.chain(arguments)
          .drop(3)
          .reduce(function(m,v) { return _.extend(m, enhance(v)); }, {})
          .value();

  function enhance(object) {
    return _.chain(object)
            .map(function(v,k) { return [k, enhanceTemplate(v)]; })
            .object()
            .value();
  }
  function enhanceTemplate(template) {
    return _.extend(template, {
      json_template:         JsonTemplater(createWrapper, templateTransform(template.templates.updates)),
      json_template_display: JsonTemplater(displayWrapper, displayTransform(template.templates.display)),
      validation:            template.validation || _.identity,
      generator:             Generators[template.generator || template.model](template, fieldMappers(template.templates.updates)),
      reader:                Readers[template.reader || template.model](template),
      emptyRow:              template.emptyRow || _.first
    });
  }

  function createWrapper(descriptor, f) {
    if (_.isUndefined(descriptor["default"])) return f;
    return function() {
      var mapped = f.apply(this, arguments);
      return (_.isUndefined(mapped) || _.isNull(mapped)) ? descriptor["default"] : mapped;
    };
  }

  // Used to wrap standard cell converters in an structure appropriate for HTML display
  function displayWrapper(descriptor, f) {
    return _.compose(htmlConverter, f);

    function htmlConverter(value) {
      return $.extend({}, descriptor, {value:value});
    }
  }

  // Recurses down the structure passed looking for the columnName definitions.  This builds a
  // mapping from the header in the manifest to a function that converts a raw value to it's typed
  // representation in the manifest.
  function fieldMappers(json) {
    return _.reduce(json, function(memo, value, field) {
      if (!_.isObject(value)) return memo;
      var merge = undefined;
      if (_.isUndefined(value.columnName)) {
        merge = fieldMappers(value)
      } else {
        merge = _.build(value.columnName, createWrapper(value, converterFor(value).rawToManifest));
      }
      return _.extend(memo, merge);
    }, {});
  }

  /**********************************************************************************************************
   * FUNCTIONS DEALING WITH JSON TEMPLATES
   **********************************************************************************************************/
  function JsonTemplater(wrapper, template) {
    var extractorMap = createExtractorMap(wrapper, template);
    var extractor    = _.partial(extractRowData, extractorMap);
    return _.compose(extractor, upperCaseRowKeys);
  }

  function upperCaseRowKeys(row) {
    return _.chain(row).map(upperCaseKey).object().value();
  }
  function upperCaseKey(value, key) {
    return [key.toUpperCase(),value];
  }
  function extractRowData(extractorMap, rowData) {
    return _.reduce(extractorMap, function(memo, extractor, key) {
      memo[key] = extractor(rowData);
      return memo;
    },{});
  }

  function isCellDescriptor(item){
    return !_.isUndefined(item["columnName"]) || !_.isUndefined(item["constant"]);
  }

  function extractorGenerator (wrapper, cellDescriptor){
    if (!_.isUndefined(cellDescriptor.constant)) {
      return _.constant(cellDescriptor.constant);
    }

    var converter = wrapper(cellDescriptor, converterFor(cellDescriptor).manifestToRaw);
    var column    = cellDescriptor.columnName.toUpperCase();

    return function(rowData) {
      var value = rowData[column] || cellDescriptor["default"];
      return converter(value);
    }
  }

  function createExtractorMap (wrapper, data){
    return _.reduce(data, function(memo, value, key){
      var handler = undefined;

      if (isCellDescriptor(value)){
        handler = extractorGenerator(wrapper, value);
      } else if ($.isPlainObject(value)) {
        handler = _.partial(extractRowData, createExtractorMap(wrapper, value));
      } else {
        handler = _.constant(value);
      }

      memo[key] = handler;
      return memo;
    },{});
  }

  function barcodeConverter(descriptor) {
    switch(descriptor.format) {
      case "ean13": return ean13BarcodeConverter; break;
      default:      return identityConverter;     break;
    }
  }
  function converterFor(cellDescriptor) {
    switch (cellDescriptor.type) {
      case "int":      return intConverter;     break;
      case "float":    return floatConverter;   break;
      case "boolean":  return booleanConverter; break;
      case "checkbox": return booleanConverter; break;
      case "barcode":  return barcodeConverter(cellDescriptor); break;
      default:         return identityConverter;       break;
    }
  }
});
