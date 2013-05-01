define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/default_page_partial.html'
  , 'extraction_pipeline/default/default_model'
], function (config, BasePresenter, defaultPagePartialHtml, Model) {
  'use strict';

  /*
     The default page presenter. Deals with login.
     */
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
    setupPresenter:function (setupData, jquerySelection) {
      this.setupPlaceholder(jquerySelection);
      this.model = Object.create(Model).init(this);
      this.setupSubPresenters();
      this.renderView();
      this.jquerySelectionForUser().find("input").removeAttr('disabled').focus();
      this.jquerySelectionForLabware().find("input").attr('disabled', true);
      return this;
    },
    setupSubPresenters:function () {
      // check with this.model for the needed subpresenters...
      this.userBCSubPresenter = this.presenterFactory.create('scan_barcode_presenter', this);
      this.labwareBCSubPresenter = this.presenterFactory.create('scan_barcode_presenter', this);
      this.setupSubModel();
      return this;
    },
    setupSubModel:function () {
      var that = this;
      this.jquerySelectionForUser = function () {
        return that.jquerySelection().find(".user_barcode");
      };

      this.jquerySelectionForLabware = function () {
        return that.jquerySelection().find(".labware_barcode");
      };

      // As labware is a resource, we need to ensure it's existence to extract a barcode
      var labwareBarcode = this.model.labware ? this.model.labware.labels.barcode.value : '';

      this.userBCSubPresenter.setupPresenter({type:"user", barcode:this.model.user});
      this.labwareBCSubPresenter.setupPresenter({type:"tube", barcode:labwareBarcode});

      return this;
    },

    renderView: function () {
      var userCallback = function(event, template, presenter){
        presenter.model.user = event.currentTarget.value;
        presenter.setupSubPresenters();
        presenter.renderView();
        template.find("input").attr('disabled', true);
      };

      var labwareCallback = function(event, template, presenter){
        presenter.model
        .setLabwareFromBarcode(event.currentTarget.value)
        .then(function(model){
          presenter.owner.childDone(presenter, "login", model);
        });

      }

      this.jquerySelection().append(_.template(defaultPagePartialHtml)({}));
      this.jquerySelectionForUser().append(this.bindReturnKey( this.userBCSubPresenter.renderView(), userCallback ));
      this.jquerySelectionForLabware().append(this.bindReturnKey( this.labwareBCSubPresenter.renderView(), labwareCallback ));

      return this;
    },


    release:function () {
      this.jquerySelection().empty();
      return this;
    }

  });

  return DefaultPresenter;
});

