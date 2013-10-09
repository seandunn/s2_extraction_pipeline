define([
  'lib/reception_templates/generators',
  'lib/reception_templates/readers',

  // Add new templates after this comment and they will be automatically loaded
  'reception_templates/cgap_lysed',
  'reception_templates/hmdmc_lysed',
  'reception_templates/general_plate',
  'reception_templates/filter_paper'
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
      json_template:         JsonTemplater(createWrapper, templateTransform(template.templates.updates)),
      json_template_display: JsonTemplater(displayWrapper, displayTransform(template.templates.display)),
      validation:            template.validation || _.identity,
      generator:             Generators[template.model](template),
      reader:                Readers[template.model](template)
    });
  }

  function createWrapper(descriptor, f) {
    return f;
  }

  // Used to wrap standard cell converters in an structure appropriate for HTML display
  function displayWrapper(descriptor, f) {
    return _.compose(htmlConverter, f);

    function htmlConverter(value) {
      return $.extend({}, descriptor, {value:value});
    }
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

    var converter = wrapper(cellDescriptor, converterFor(cellDescriptor));
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
  function ean13BarcodeConverter(value) {
    return _.str.lpad(""+intConverter(value), 13, "0");
  }
  function barcodeConverter(descriptor) {
    switch(descriptor.format) {
      case "ean13": return ean13BarcodeConverter; break;
      default:      return _.identity;            break;
    }
  }
  function converterFor(cellDescriptor) {
    switch (cellDescriptor.type) {
      case "int":      return intConverter;     break;
      case "float":    return parseFloat;       break;
      case "boolean":  return booleanConverter; break;
      case "checkbox": return booleanConverter; break;
      case "barcode":  return barcodeConverter(cellDescriptor); break;
      default:         return _.identity;       break;
    }
  }
});
