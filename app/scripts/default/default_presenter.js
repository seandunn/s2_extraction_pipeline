define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/default_page_partial.html'
  , 'extraction_pipeline/default/default_model'
  , 'extraction_pipeline/lib/util'
  , 'extraction_pipeline/lib/pubsub'
], function (config, BasePresenter, defaultPagePartialHtml, Model, Util, PubSub) {
  'use strict';

  var userCallback = function(value, template, presenter){
    var barcode = Util.pad(value);
    presenter.model.setUserFromBarcode(barcode)
        .fail(function (error) {
          PubSub.publish('s2.status.error', presenter, error);
        })
        .then(function(){
          template.find("input").val(barcode);
          template.find("input").attr('disabled', true);
          presenter.jquerySelectionForLabware().
              find("input").
              removeAttr('disabled').
              focus();
        });
  };

  var barcodeErrorCallback = function(errorText){
    return function(value, template, presenter){
      PubSub.publish('s2.status.error', this, {message: errorText});
    };
  };

  var labwareCallback = function(value, template, presenter){
    template.find("input").attr('disabled', true);
    template.find('.alert-error').addClass('hide');
    presenter.model.setLabwareFromBarcode(Util.pad(value))
        .fail(function (error) {
          PubSub.publish('s2.status.error', presenter, error);
        })
        .then(login);
    function login(model){
      if (model.isValid()){
        presenter.owner.childDone(presenter, "login", model);
      } else {
        barcodeErrorCallback("Labware not found on system.")(undefined, template);
      }
    }
  };

  var DefaultPresenter = Object.create(BasePresenter);

  $.extend(DefaultPresenter, {
    register:function (callback) {
      callback('default', function (owner, factory, initData) {
        return Object.create(DefaultPresenter).init(owner, factory, initData);
      });
    },

    init:function (owner, presenterFactory) {
      this.presenterFactory = presenterFactory;
      this.owner = owner;
      return this;
    },

    setupPresenter: function (setupData, jquerySelection) {
      var that = this;
      this.setupPlaceholder(jquerySelection);
      this.model = Object.create(Model).init(this);

      this.userBCSubPresenter = this.presenterFactory.create('scan_barcode_presenter', this).init({type:"user"});
      this.labwareBCSubPresenter = this.presenterFactory.create('scan_barcode_presenter', this).init({type:"tube"});

      this.jquerySelectionForUser = function () {
        return that.jquerySelection().find(".user_barcode");
      };

      this.jquerySelectionForLabware = function () {
        return that.jquerySelection().find(".labware_barcode");
      };

      this.renderView();
      this.jquerySelectionForUser().find("input").removeAttr('disabled').focus();
      this.jquerySelectionForLabware().find("input").attr('disabled', true);

      return this;
    },

    renderView: function () {
      this.jquerySelection().html(_.template(defaultPagePartialHtml)({}));
      var errorCallback = barcodeErrorCallback('Barcode must be a 13 digit number.');

      this.jquerySelectionForUser().append(this.bindReturnKey( this.userBCSubPresenter.renderView(), userCallback, errorCallback ));
      this.jquerySelectionForLabware().append(this.bindReturnKey( this.labwareBCSubPresenter.renderView(), labwareCallback, errorCallback));

      return this;
    },

    release: function(){}

  });

  return DefaultPresenter;
});

