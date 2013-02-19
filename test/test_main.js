require.config({
  shim: {
    },

  paths: {
      domReady: 'components/requirejs-domready/domReady',
      d3: 'components/d3',
      config: 'test_config',
      spec: 'spec',
      json: 'json'
    },

//    urlArgs: "bust=" + (new Date()).getTime(),
});
 
require(['domReady!', 'spec/selection_page_spec'], function() {
  // use app here
    runJasmineTests();

});
