require.config({
  shim:{
  },

  baseUrl: '.',

  paths:{
    hm:'vendor/hm',
    esprima:'vendor/esprima',
    jquery:'vendor/jquery.min',
    mapper:'/components/S2Mapper/app/scripts/mapper',
    mapper_services:'/components/S2Mapper/app/scripts/services',
    mapper_test: 'components/S2Mapper/test',
    labware:'/components/labware/app/scripts',
    config:'scripts/devel_config',
    json:'/components/S2Mapper/app/test/json',
    text: '/components/requirejs-text/text',
    extraction_pipeline: 'scripts'
  }
});

require(['extraction_pipeline/app',
  'extraction_pipeline/presenters/presenter_factory'],
  function (app, PresenterFactory) {
    var theApp = new app(new PresenterFactory());
    var inputModelForApp = undefined;

    theApp.setupPresenter(inputModelForApp);

});

