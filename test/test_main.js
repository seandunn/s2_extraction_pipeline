require.config({
  shim:{
  },

  baseUrl:'.',

  paths:{
    d3:                 'components/d3/',
    text:               'components/requirejs-text/text',
    domReady:           'components/requirejs-domready/domReady',
    labware:            'components/labware/app/scripts',
    mapper:             'components/S2Mapper/app/scripts/mapper/',
    mapper_services:    'components/S2Mapper/app/scripts/services/',
    mapper_test:        'components/S2Mapper/test/',
    mapper_testjson:    'components/S2Mapper/test/json/',
    extraction_pipeline:'scripts/',
    views:              'scripts/views/',
    models:             'scripts/models/',
    presenters:         'scripts/presenters/',
    config:             'test_config',
    spec:               'spec/',
    lib:                'lib/',
    pipeline_testjson:  'json/'
  }
});
 
require(['domReady!'
   ,'spec/fake_user_spec'
//   ,'spec/app_spec'
   ,'spec/selection_page_model_spec'
    ,'spec/csv_parser_spec'
  , 'spec/json_templater_spec'
//  , 'spec/default_page_presenter_spec'
//   ,'spec/default_model_spec'
   ,'spec/selection_page_spec'
   ,'spec/workflow_engine_spec'
//   ,'spec/kit_presenter_spec'
//   ,'spec/scan_barcode_presenter_spec'
],
  function () {
    // use app here
    _.templateSettings.variable = 'templateData';

    // Very slight delay seems to be needed to get things synced...
    window.setTimeout(runJasmineTests, 50);
  });
