define(['config'
  , 'controllers/base_controller'
  , 'text!html_partials/_extraction.html'
  , 'models/lab_activities_model'
  , 'lib/util'
  , 'lib/pubsub'
], function (config, BaseController, extractionPartialHtml, Model, Util,  PubSub) {
  'use strict';

  var LabActivitiesController = Object.create(BaseController);

  $.extend(LabActivitiesController, {
    register: function (callback) {
      callback('lab_activities_controller', function () {
        var instance = Object.create(LabActivitiesController);
        LabActivitiesController.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.factory = factory;
      this.owner = owner;

      this.model = Object.create(Model).init(this);

      this.rerackingComponent = {};
      this.homeComponent = {};

      this.view = this.createHtml();

      $.extend(this.rerackingComponent,{controller:this.factory.create('reracking_controller', this, config)});
      this.rerackingComponent.selection.append(this.rerackingComponent.controller.view);

      this.currentComponent = this.homeComponent;

      return this;
    },

    createHtml: function () {
      var html = $(_.template(extractionPartialHtml)());

      var userBCSubController = this.factory.create('scan_barcode_controller', this).init({type:"user"});

      this.backButtonSelection = html.find("#back-button");
      this.rerackingBtnSelection = html.find("#reracking-btn");
      this.userReaderSelection = html.find("#userReader");
      this.userValidationSelection = html.find("#userValidation");
      this.componentChoiceSelection = html.find('#choice');

      $.extend(this.rerackingComponent,{selection: html.find(".reracking")});
      $.extend(this.homeComponent,{selection: html.find("#homePage")});

      this.backButtonSelection.click(this.goBack());
      this.rerackingBtnSelection.click(this.goForward(this.rerackingComponent));

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

  return LabActivitiesController;
});

