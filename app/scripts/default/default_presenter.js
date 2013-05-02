define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/default_page_partial.html'
  , 'extraction_pipeline/default/default_model'
], function (config, BasePresenter, defaultPagePartialHtml, Model) {
  'use strict';

  var userCallback = function(event, template, presenter){
    presenter.model.user = event.currentTarget.value;
    template.find("input").attr('disabled', true);
    presenter.jquerySelectionForLabware().find("input").removeAttr('disabled').focus();
  };

  var labwareCallback = function(event, template, presenter){
    template.find("input").attr('disabled', true);

    var login = function(model){
      presenter.owner.childDone(presenter, "login", model);
    };

    presenter.model
    .setLabwareFromBarcode(event.currentTarget.value)
    .then(login, login);  // Hack!  Login whether or not we find a batch...
                          // Should be moved to SelectionPresenter.
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
      this.jquerySelection().append(_.template(defaultPagePartialHtml)({}));

      this.jquerySelectionForUser().append(this.bindReturnKey( this.userBCSubPresenter.renderView(), userCallback ));
      this.jquerySelectionForLabware().append(this.bindReturnKey( this.labwareBCSubPresenter.renderView(), labwareCallback ));

      return this;
    },

    release:function () { }

  });

  return DefaultPresenter;
});

