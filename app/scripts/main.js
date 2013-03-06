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

require(['extraction_pipeline/app',
  'extraction_pipeline/presenters/labware_presenter',
  'extraction_pipeline/presenters/presenter_factory',
  'extraction_pipeline/presenters/labware_presenter',
  'extraction_pipeline/presenters/kit_presenter',
  'extraction_pipeline/presenters/batch_presenter'],
  function (app, LabwarePresenter, pf, LabwarePresenter, KitPresenter, BatchPresenter) {
    var theApp = new app();
  var inputModelForApp = undefined;
//  inputModelForApp = {
//    userUUID:"2345678901234",
//    labwareUUID:"106d61c0-6224-0130-90b6-282066132de2",
//    batchUUID:undefined //"1234567890"
//  };
//    theApp.setupPresenter(inputModelForApp);




//    var kitPresenter = new KitPresenter(undefined, new pf());
    var batchPresenter = new BatchPresenter(undefined, new pf());
    var dummyInput = {
      "tubes" : [
        {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"},
        {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"},
        {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"},
        {"uuid" : "106d61c0-6224-0130-90b6-282066132de2"}
      ]
    };

//    kitPresenter.setupPresenter(dummyInput, function() { return $("#content"); });
    batchPresenter.setupPresenter(dummyInput, function() { return $("#content"); });
//    var lp = new LabwarePresenter(undefined, new pf());
//    lp.setupPresenter(undefined, function() { return $("#content"); });

//  var labwarePresenter = new LabwarePresenter(undefined, new pf());
//  var labwareModel = {"uuid" : "106d61c0-6224-0130-90b6-282066132de2",
//    "expected_type" : "tube"};
//  labwarePresenter.setupPresenter(labwareModel, function() { return $("#content"); })


});

