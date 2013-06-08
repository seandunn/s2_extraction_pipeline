define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/reception_partial.html'
  , 'extraction_pipeline/models/reception_model'
  , 'extraction_pipeline/lib/pubsub'
  , 'extraction_pipeline/lib/reception_templates'
], function (config, BasePresenter, receptionPartialHtml, Model, PubSub, ReceptionTemplates) {
  'use strict';

  var ReceptionPresenter = Object.create(BasePresenter);

  $.extend(ReceptionPresenter, {
    register: function (callback) {
      callback('reception_presenter', function() {
        var instance = Object.create(ReceptionPresenter);
        ReceptionPresenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.factory = factory;
      this.owner = owner;
      this.view = this.createHtml();

      this.manifestMakerPresenter = this.factory.create('manifest_maker_presenter', this, config);
      this.view.find(".manifest-maker").append(this.manifestMakerPresenter.view);
      return this;
    },

    createHtml:function(){
      return $(_.template(receptionPartialHtml)());
    }

  });

  return ReceptionPresenter;
});

