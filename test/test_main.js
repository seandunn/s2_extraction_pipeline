require.config({
  shim: {
    },

  paths: {
      jquery: '../components/jquery',
      d3: '../components/d3',
      domReady: '../components/requirejs-domready',
      config: 'test_config',
      scripts: '../app/scripts',
      spec: 'spec',
      json: 'json'
    }
});
 
require([], function() {
  // use app here
});
