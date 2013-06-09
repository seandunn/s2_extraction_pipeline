define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/reception_partial.html'
  , 'extraction_pipeline/lib/pubsub'
  , 'extraction_pipeline/lib/reception_templates'
], function (config, BasePresenter, receptionPartialHtml, PubSub, ReceptionTemplates) {
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
      this.view = this.createHtml();

      this.manifestMakerPresenter = this.factory.create('manifest_maker_presenter', this, config);
      this.manifestMakerSelection.append(this.manifestMakerPresenter.view);
      this.manifestReaderPresenter = this.factory.create('manifest_reader_presenter', this, config);
      this.manifestReaderSelection.append(this.manifestReaderPresenter.view);

      this.manifestReaderBtnSelection.trigger('click');
      return this;
    },

    createHtml: function () {
      var html = $(_.template(receptionPartialHtml)());

      this.backButtonSelection = html.find("#backButton");
      this.homeSelection = html.find("#choice");
      this.manifestReaderSelection = html.find(".manifest-maker");
      this.manifestMakerSelection = html.find(".manifest-reader");
      this.manifestReaderBtnSelection = html.find("#read-manifest-btn");
      this.manifestMakerBtnSelection = html.find("#create-manifest-btn");

      this.backButtonSelection.click(this.goBack());
      this.manifestReaderBtnSelection.click(this.goForward(this.manifestReaderSelection));
      this.manifestMakerBtnSelection.click(this.goForward(this.manifestMakerSelection,1));
      this.currentSelection = this.homeSelection;
      return html;
    },

    goBack:function(){
      var thisPresenter = this;
      return function(){
        swipeBackFunc(thisPresenter.currentSelection,thisPresenter.homeSelection,thisPresenter.backButtonSelection,0)();
        thisPresenter.currentSelection = thisPresenter.homeSelection;
      }
    },

    goForward:function(nextSelection){
      var thisPresenter = this;
      return function(){
        swipeNextFunc(thisPresenter.currentSelection,nextSelection,thisPresenter.backButtonSelection,1)();
        thisPresenter.currentSelection = nextSelection;
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

