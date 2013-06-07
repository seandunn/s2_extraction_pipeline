define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/reception_partial.html'
  , 'extraction_pipeline/lib/pubsub'
], function (config, BasePresenter, receptionPartialHtml, PubSub) {
  'use strict';

  var ReceptionPresenter = Object.create(BasePresenter);

  $.extend(ReceptionPresenter, {
    register: function (callback) {
      callback('reception_presenter', function () {
        var instance = Object.create(ReceptionPresenter);
        ReceptionPresenter.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.factory = factory;
      this.owner = owner;

      this.manifestMakerComponent = {};
      this.manifestReaderComponent = {};
      this.homeComponent = {};

      this.view = this.createHtml();

      $.extend(this.manifestMakerComponent,{presenter:this.factory.create('manifest_maker_presenter', this, config)});
      this.manifestMakerComponent.selection.append(this.manifestMakerComponent.presenter.view);
      $.extend(this.manifestReaderComponent,{presenter:this.factory.create('manifest_reader_presenter', this, config)});
      this.manifestReaderComponent.selection.append(this.manifestReaderComponent.presenter.view);

      this.currentComponent = this.homeComponent;

      return this;
    },

    createHtml: function () {
      var html = $(_.template(receptionPartialHtml)());

      this.backButtonSelection = html.find("#back-button");
      this.manifestMakerBtnSelection = html.find("#create-manifest-btn");
      this.manifestReaderBtnSelection = html.find("#read-manifest-btn");

      $.extend(this.manifestMakerComponent,{selection: html.find(".manifest-maker")});
      $.extend(this.manifestReaderComponent,{selection: html.find(".manifest-reader")});
      $.extend(this.homeComponent,{selection: html.find("#choice")});

      this.backButtonSelection.click(this.goBack());
      this.manifestReaderBtnSelection.click(this.goForward(this.manifestReaderComponent));
      this.manifestMakerBtnSelection.click(this.goForward(this.manifestMakerComponent));

      return html;
    },

    goBack:function(){
      var thisPresenter = this;
      return function(){
        swipeBackFunc(thisPresenter.currentComponent.selection,thisPresenter.homeComponent.selection,thisPresenter.backButtonSelection,0)();
        PubSub.publish("s2.reception.reset_view", thisPresenter, {});
        thisPresenter.currentComponent = thisPresenter.homeComponent;
      }
    },

    goForward:function(nextComponent){
      var thisPresenter = this;
      return function(){
        swipeNextFunc(thisPresenter.currentComponent.selection,nextComponent.selection,thisPresenter.backButtonSelection,1)();
        thisPresenter.currentComponent = nextComponent;
      }
    }
  });

  function swipeNextFunc(currentElement, nextElement, backArrow, toDepth) {
    return function () {
      if (toDepth === 1){
        backArrow.show();
      }
      currentElement.animate(
        {opacity: 0, left:"-100%" },
        500,
        function () {
          currentElement
            .hide()
            .css('opacity', 0)
            .css('zIndex', -1000);
        });
      nextElement
        .show()
        .css('opacity', 0)
        .css('zIndex', 1000)
        .animate(
        {opacity: 1, left:0},
        500
      );
    }
  }

  function swipeBackFunc(currentElement, previousElement, backArrow, toDepth) {
    return function () {
      if (toDepth === 0){
        backArrow.hide();
      }
      currentElement.animate(
        {opacity: 0.0, left:"100%" },
        500,
        function () {
          currentElement
            .hide()
            .css('opacity', 0)
            .css('zIndex', -1000);
        });
      previousElement
        .show()
        .css('opacity', 0)
        .css('zIndex', 1000)
        .animate(
        {opacity: 1, left:0},
        500
      );
    }
  }

  return ReceptionPresenter;
});

