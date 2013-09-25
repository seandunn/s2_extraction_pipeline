define([
  'lib/reception_templates/generators',
  'lib/reception_templates/readers',

  // Add new templates after this comment and they will be automatically loaded
  'reception_templates/cgap_lysed',
  'reception_templates/general_plate'
], function (Generators, Readers) {
  'use strict';

  var templateTransform = _.identity;
  var displayTransform  = function(json) {
    return _.reduce(json, function(m,v,i) { return _.extend(m,v); }, {});
  };

  return _.chain(arguments)
          .drop(2)
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
      json_template:         JsonTemplater(templateTransform(template.templates.updates)),
      json_template_display: JsonTemplater(displayTransform(template.templates.display)),
      validation:            template.validation || _.identity,
      generator:             Generators[template.model](template)
    });
  }


  /**********************************************************************************************************
   * FUNCTIONS DEALING WITH JSON TEMPLATES
   **********************************************************************************************************/
  function JsonTemplater(template) {
    var extractorMap = createExtractorMap(template);
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
    return !_.isUndefined(item["columnName"]);
  }

  function extractorGenerator (cellDescriptor){
    var converter = converterFor(cellDescriptor);
    var column    = cellDescriptor.columnName.toUpperCase();

    return function(rowData) {
      var value = rowData[column] || cellDescriptor["default"];
      return converter(value);
    }
  }

  function createExtractorMap (data){
    return _.reduce(data, function(memo, value, key){
      var handler = undefined;

      if (isCellDescriptor(value)){
        handler = extractorGenerator(value);
      } else if ($.isPlainObject(value)) {
        handler = _.partial(extractRowData, createExtractorMap(value));
      } else {
        handler = memoize(value);
      }

      memo[key] = handler;
      return memo;
    },{});
  }

  function memoize(value) {
    return function() {
      return value;
    };
  }

  /*
   * Converters.  These take a string value and give you an appropriate representation of it.
   */
  function intConverter(value) {
    value = parseInt(value, 10);
    return isNaN(value) ? undefined : value;
  }
  function booleanConverter(value) {
    var upped = (value || 'NO').toUpperCase();
    return (upped === 'YES') || (upped === 'TRUE') || (upped === 'Y');
  }
  function selectConverter(cellDescriptor, value) {
    return $.extend({}, cellDescriptor, {value:value});
  }
  function converterFor(cellDescriptor) {
    switch (cellDescriptor.type) {
      // used to return plain values
      case "int":     return intConverter; break;
      case "float":   return parseFloat; break;
      case "boolean": return booleanConverter; break;

      // used to generate html nodes
      case "select":   return _.partial(selectConverter, cellDescriptor); break;
      case "span":     return _.partial(selectConverter, cellDescriptor); break;
      case "checkbox": return _.compose(_.partial(selectConverter, cellDescriptor), booleanConverter); break;

      default: return _.identity; break;
    }
  }
});
