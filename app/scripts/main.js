require.config({
  shim:{
  },

  baseUrl: '.',

  paths:{
    hm:                   'vendor/hm',
    esprima:              'vendor/esprima',
    jquery:               'vendor/jquery.min',
    text:                 'components/requirejs-text/text',
    spinjs:               'components/spin.js/spin',
    labware:              'components/labware/app/scripts',
    mapper:               'components/S2Mapper/app/scripts/mapper',
    mapper_services:      'components/S2Mapper/app/scripts/services',
    mapper_test:          'components/S2Mapper/test',
    mapper_testjson:      'components/S2Mapper/test/json',
    extraction_pipeline:  'scripts',
    config:               'scripts/config',
    reception_templates:  'scripts/lib/reception_templates'
  }
});

require(['extraction_pipeline/app',
  'extraction_pipeline/presenters/presenter_factory'
], function (App, PresenterFactory) {

    var theApp = new App(new PresenterFactory());

});

