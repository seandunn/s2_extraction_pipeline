require.config({
  shim: {
    },

  baseUrl: '.',

  paths: {
    d3: 'components/d3',
    domReady: 'components/requirejs-domready/domReady',
    mapper: 'components/S2Mapper/app/scripts/mapper',
    mapper_test: 'components/S2Mapper/test',
    extraction_pipeline: 'scripts/',
    labware: 'components/labware/app/scripts/',
    config: 'test_config',
    views: 'scripts/views',
    models: 'scripts/models',
    presenters: 'scripts/presenters',
    spec: 'spec',
    json: 'components/S2Mapper/test/json',
    dummyresource: 'scripts/dummyresource',
    text: '/components/requirejs-text/text'
  }
});
 
require(['domReady!',
	 'spec/selection_page_model_spec',
	 'spec/selection_page_presenter_spec',
  'spec/default_presenter_spec',
  'spec/scan_barcode_model_spec',
//   'spec/app_spec',
	 'spec/scan_barcode_presenter_spec'//,
//	 'spec/tube_removal_presenter_spec'
],
 function() {
  // use app here

  // Very slight delay seems to be needed to get things synced...
  window.setTimeout(runJasmineTests, 50);
});
