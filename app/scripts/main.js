require.config({
  shim:{
  },

  baseUrl: '.',

  paths:{
    hm:'vendor/hm',
    esprima:'vendor/esprima',
    jquery:'vendor/jquery.min',
    mapper:'/components/S2Mapper/app/scripts/mapper',
    labware:'/components/labware/app/scripts',    
    config:'scripts/config',
    json:'/components/apiExample/workflows',
    text: '/components/requirejs-text/text',
    extraction_pipeline: 'scripts'
  }
});

require(['extraction_pipeline/app', 'extraction_pipeline/presenters/kit_presenter', 'extraction_pipeline/presenters/presenter_factory'], function (app, KitPresenter, PF) {
//  var theApp = new app();
//  theApp.setupPresenter();
    var pf = new PF();
    var kitPresenter = new KitPresenter({}, pf);
    kitPresenter.setupPresenter({}, function() { return $("#content"); });
});

