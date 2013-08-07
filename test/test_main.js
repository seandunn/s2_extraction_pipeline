requirejs.config({
  shim:{
  },

  baseUrl:'../app',

  paths:{
    text:                 'components/requirejs-text/text',
    spinjs:               'components/spin.js/spin',
    domReady:             'components/requirejs-domready/domReady',
    labware:              'scripts/labware',
    mapper:               'components/S2Mapper/app/scripts/mapper',
    mapper_services:      'components/S2Mapper/app/scripts/services',
    mapper_test:          'components/S2Mapper/test',
    mapper_testjson:      'components/S2Mapper/test/json',
    extraction_pipeline:  'scripts',
    config:               '../test/test_config',
    spec:                 '../test/spec',
    lib:                  '../test/lib',
    pipeline_testjson:    '../test/json',
    pipeline_testcsv:     '../test/csv',
    reception_templates:  'scripts/lib/reception_templates'
  }
});

requirejs([
    'spec/csv_parser_spec',
    'spec/fake_user_spec',
    'spec/json_templater_spec',
    'spec/reception_app_spec',
    'spec/selection_page_model_spec',
    'spec/selection_page_spec',
    'spec/util_spec'
    ], function () {
      _.templateSettings.variable = 'templateData';
      mocha.run();
});