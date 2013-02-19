require.config({
    shim:{
    },

    paths:{
        hm:      'vendor/hm',
        esprima: 'vendor/esprima',
        jquery:  'vendor/jquery.min',
        mapper:  '../components/S2Mapper/app/scripts/mapper',
        labware: '../components/labware',
        config:  'config',
        json: '/components/apiExample/workflows'
        ,d3: '/components/d3'
    }
});

require(['app'], function (app) {
    // use app here
    var theApp = new app();
    theApp.init();
});