define([ 'config'
  , 'mapper/s2_root'
  , 'extraction_pipeline/presenters/reception_presenter'
  , 'extraction_pipeline/extra_components/busy_box'
  , 'extraction_pipeline/alerts'
], function (config, S2Root, ReceptionPresenter, BusyBox, alerts) {
  'use strict';

  var App = Object.create({});

  $.extend(App, {
    init:             function () {
      _.templateSettings.variable = 'templateData';
      var receptionPresenter = Object.create(ReceptionPresenter).init();
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
