define(['config'
  , 'controllers/base_controller'
  , 'text!html_partials/reception_partial.html'
  , 'models/reception_model'
  , 'lib/util'
  , 'lib/pubsub'
], function (config, BaseController, receptionPartialHtml, Model, Util,  PubSub) {
  'use strict';

  var ReceptionController = Object.create(BaseController);

  $.extend(ReceptionController, {
    register: function (callback) {
      callback('reception_controller', function () {
        var instance = Object.create(ReceptionController);
        ReceptionController.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.factory = factory;
      this.owner = owner;

      this.model = Object.create(Model).init(this);

      this.manifestMakerComponent = {};
      this.manifestReaderComponent = {};
      this.homeComponent = {};

      this.view = this.createHtml();

      $.extend(this.manifestMakerComponent,{controller:this.factory.create('manifest_maker_controller', this, config)});
      this.manifestMakerComponent.selection.append(this.manifestMakerComponent.controller.view);
      $.extend(this.manifestReaderComponent,{controller:this.factory.create('manifest_reader_controller', this, config)});
      this.manifestReaderComponent.selection.append(this.manifestReaderComponent.controller.view);

      this.currentComponent = this.homeComponent;

      return this;
    },

    createHtml: function () {
      var html = $(_.template(receptionPartialHtml)());

      var userBCSubController = this.factory.create('scan_barcode_controller', this).init({type:"user"});

      this.backButtonSelection = html.find("#back-button");
      this.manifestMakerBtnSelection = html.find("#create-manifest-btn");
      this.manifestReaderBtnSelection = html.find("#read-manifest-btn");
      this.userReaderSelection = html.find("#userReader");
      this.userValidationSelection = html.find("#userValidation");
      this.componentChoiceSelection = html.find('#choice');

      $.extend(this.manifestMakerComponent,{selection: html.find(".manifest-maker")});
      $.extend(this.manifestReaderComponent,{selection: html.find(".manifest-reader")});
      $.extend(this.homeComponent,{selection: html.find("#homePage")});

      this.backButtonSelection.click(this.goBack());
      this.manifestReaderBtnSelection.click(this.goForward(this.manifestReaderComponent));
      this.manifestMakerBtnSelection.click(this.goForward(this.manifestMakerComponent));

      this.userReaderSelection.append(
        this.bindReturnKey(userBCSubController.renderView(),
          userCallback,
          barcodeErrorCallback("User barcode is not valid."))
      );

      function userCallback(value, template, controller){
        var barcode = Util.pad(value);
        controller.model.setUserFromBarcode(barcode)
          .fail(function (error) {
            PubSub.publish('s2.status.error', controller, error);
          })
          .then(function(){
            template.find("input").val(barcode);
            template.find("input").attr('disabled', true);
            controller.userValidationSelection.hide();
            controller.componentChoiceSelection.show();
          });
      }

      function barcodeErrorCallback(errorText){
        return function(value, template, controller){
          PubSub.publish('s2.status.error', this, {message: errorText});
        };
      }
      return html;
    },

    goBack:function(){
      var thisController = this;
      return function(){
        swipeBackFunc(thisController.currentComponent.selection,
          thisController.homeComponent.selection,
          thisController.backButtonSelection,
          0,
          function(){
            thisController.componentChoiceSelection.hide();
            thisController.userValidationSelection.show();
            thisController.userValidationSelection.find('input').val("").removeAttr('disabled');
            thisController.owner.resetS2Root();
          })();
        PubSub.publish("s2.reception.reset_view", thisController, {});
        thisController.currentComponent = thisController.homeComponent;
      }
    },

    goForward:function(nextComponent){
      var thisController = this;
      return function(){
        swipeNextFunc(thisController.currentComponent.selection,nextComponent.selection,thisController.backButtonSelection,1)();
        thisController.currentComponent = nextComponent;
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

  function swipeBackFunc(currentElement, previousElement, backArrow, toDepth, callBack) {
    return function () {
      callBack();
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

  return ReceptionController;
});

