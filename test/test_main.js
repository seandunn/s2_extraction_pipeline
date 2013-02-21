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
    , mapper:  '../components/S2Mapper/app/scripts/mapper'
    , labware: '../components/labware'

    }

});
 
require([], function() {
  // use app here
});
