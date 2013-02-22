require.config({
  shim: {
    },

  paths: {
      d3: 'components/d3',
      domReady: 'components/requirejs-domready/domReady',
      mapper: 'components/S2Mapper/app/scripts/mapper',
      mapper_test: 'components/S2Mapper/test',
      config: 'test_config',
      views: 'scripts/views',
      presenters: 'scripts/presenters',
      spec: 'spec',
      json: 'components/S2Mapper/test/json'
    },

});

require(["domReady!", "spec/selection_page_model_spec", "spec/selection_page_presenter_spec"], function(document) {
  // Very slight delay seems to be needed to get things synced...
  window.setTimeout(runJasmineTests, 50);
});
