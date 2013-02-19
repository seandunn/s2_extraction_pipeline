require.config({
  shim: {
    },

  paths: {
      jquery: 'components/jquery',
      d3: 'components/d3',
      domReady: 'components/requirejs-domready/domReady',
      config: 'test_config',
      scripts: 'scripts',
      spec: 'spec',
      json: 'json'
    },

    urlArgs: "bust=" + (new Date()).getTime(),
});
 
require([], function() {
  // use app here
});
