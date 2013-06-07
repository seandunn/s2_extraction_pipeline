define([ 'config'
  , 'mapper/s2_root'
  , 'extraction_pipeline/extra_components/busy_box'
], function (config, S2Root, BusyBox) {
  'use strict';

  var App = Object.create({});

  $.extend(App, {
    init:             function (presenterFactory) {
      this.presenterFactory = presenterFactory;

      _.templateSettings.variable = 'templateData';

      $('#server-url').text(config.apiUrl);
      $('#release').text(config.release);

      var configuration = { printerList: config.printers };
      var receptionPresenter = this.presenterFactory.create('reception_presenter', this, configuration);
      $("#content").append(receptionPresenter.view);
      this.addEventHandlers();
    },
    addEventHandlers: function () {
      BusyBox.init();
    },
    getS2Root:        function () {
      if (this.rootPromise === undefined) {
        // User should be passed in here not hard-coded
        this.rootPromise = S2Root.load({user: "username"});
      }
      return this.rootPromise;
    }
  });

  return App;
})
;
