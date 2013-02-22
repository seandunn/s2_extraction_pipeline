require.config({
  shim:{
  },

  paths:{
    hm:'vendor/hm',
    esprima:'vendor/esprima',
    jquery:'vendor/jquery.min',
    mapper:'../components/S2Mapper/app/scripts/mapper',
    labware:'../components/labware',
    config:'config',
    json:'/components/apiExample/workflows',
    text: '../components/requirejs-text/text'
  }
});

require(['app'], function (app) {
  var theApp = new app();
  theApp.init();
});

