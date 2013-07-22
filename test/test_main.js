require.config({
  shim:{
  },

  baseUrl:'.',

  paths:{
    text:                 'components/requirejs-text/text',
    spinjs:               'components/spin.js/spin',
    domReady:             'components/requirejs-domready/domReady',
    labware:              'components/labware/app/scripts',
    mapper:               'components/S2Mapper/app/scripts/mapper/',
    mapper_services:      'components/S2Mapper/app/scripts/services/',
    mapper_test:          'components/S2Mapper/test/',
    mapper_testjson:      'components/S2Mapper/test/json/',
    extraction_pipeline:  'scripts/',
    views:                'scripts/views',
    models:               'scripts/models',
    presenters:           'scripts/presenters',
    config:               'test_config',
    spec:                 'spec/',
    lib:                  'lib/',
    pipeline_testjson:    'json/',
    pipeline_testcsv:     'csv/',
    reception_templates:  'scripts/lib/reception_templates'
  }
});
 
require(['domReady!'
        ,'spec/fake_user_spec'
        ,'spec/selection_page_model_spec'
        ,'spec/csv_parser_spec'
        ,'spec/json_templater_spec'
        ,'spec/selection_page_spec'
        ,'spec/reception_app_spec'
        ,'spec/util_spec'
],
  function () {
    // use app here
    _.templateSettings.variable = 'templateData';

    // Very slight delay seems to be needed to get things synced...
    window.setTimeout(runJasmineTests, 50);
  });
