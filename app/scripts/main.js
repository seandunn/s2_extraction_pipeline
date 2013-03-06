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

require(['extraction_pipeline/app'], function (app) {
    var theApp = new app();
  var inputModelForApp = undefined;
  inputModelForApp = {
    userUUID:"2345678901234",
    labwareUUID:"106d61c0-6224-0130-90b6-282066132de2",
    batchUUID:undefined //"1234567890"
  };
    theApp.setupPresenter(inputModelForApp);
//    var kitPresenter = new KitPresenter(undefined, new pf());
//    kitPresenter.setupPresenter(undefined, function() { return $("#content"); });

});

