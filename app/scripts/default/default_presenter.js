define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/default/default_view'
  , 'extraction_pipeline/default/default_model'
],
  function (config, BasePresenter, View, Model) {
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
        this.setupView();
        this.setupSubPresenters();
        this.renderView();
        this.jquerySelectionForUser().find(".barcodeInput").removeAttr('disabled').focus();
        this.jquerySelectionForLabware().find(".barcodeInput").attr('disabled', true);
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
      setupView: function () {
        this.view = new View(this, this.jquerySelection);
        return this;
      },

      renderView: function () {
        var userCallback = function(event, template, presenter){
          presenter.model.setUserFromBarcode(event.currentTarget.value);
          template.find(".barcodeInput").attr('disabled', true);
        };

        var labwareCallback = function(event, template, presenter){
          presenter.model.setLabwareFromBarcode(event.currentTarget.value);
        }

        this.view.renderView();
        this.jquerySelectionForUser().append(this.bindReturnKey( this.userBCSubPresenter.renderView(), userCallback ));
        this.jquerySelectionForLabware().append(this.bindReturnKey( this.labwareBCSubPresenter.renderView(), labwareCallback ));

        return this;
      },


      release:function () {
        this.view.release();

        return this;
      },
      childDone:function (child, action, data) {
        // called when a child  wants to say something...
        var presenter = this;
        if (child === this.model) {
          switch (action) {
            case "modelUpdated":
              if (this.view) {
              this.setupSubPresenters();
              this.renderView();
            }
            break;
            case "modelValidated":
              var dataForOwner = {
              userUUID:this.model.user,
              labware:this.model.labware,
              batch:this.model.batch
            };
            console.log(dataForOwner.batch);
            this.owner.childDone(this, "login", dataForOwner);
            break;
          }
          return;
        }
        return this;
      }
    });

    return DefaultPresenter;
  }
      );
