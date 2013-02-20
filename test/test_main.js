require.config({
  shim: {
    },

  paths: {
      domReady: 'components/requirejs-domready/domReady',
      d3: 'components/d3',
      config: 'test_config',
      views: 'scripts/views',
      presenters: 'scripts/presenters',
      spec: 'spec',
      json: 'json'
    },

//    urlArgs: "bust=" + (new Date()).getTime(),
});
 
require(['domReady!', 'spec/selection_page_model_spec', 'spec/selection_page_presenter_spec'], function() {
  // use app here
    runJasmineTests();

});
