require.config({
  shim:{
  },

  baseUrl: '.',

  paths:{
    hm:                   'vendor/hm',
    esprima:              'vendor/esprima',
    jquery:               'vendor/jquery.min',
    text:                 'components/requirejs-text/text',

    labware:              'components/labware/app/scripts',
    mapper:               'components/S2Mapper/app/scripts/mapper',
    mapper_services:      'components/S2Mapper/app/scripts/services',
    mapper_test:          'components/S2Mapper/test',
    mapper_testjson:      'components/S2Mapper/test/json',
    extraction_pipeline:  'scripts',
    config:               'scripts/config'
  }
});

require(['extraction_pipeline/app',
  'extraction_pipeline/presenters/presenter_factory'
], function (App, PresenterFactory) {
    // HACK!  Fixes issue where two model dialogs cause Chrome to crash:
    //    https://github.com/twitter/bootstrap/issues/4781#issuecomment-10911587
    var oldFocus = jQuery().modal.Constructor.prototype.enforceFocus;
    jQuery().modal.Constructor.prototype.enforceFocus = function(){};

    var theApp = new App(new PresenterFactory());

    theApp.setupPresenter();

});

