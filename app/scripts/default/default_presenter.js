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
        this.userBCSubPresenter.focus();
        this.labwareBCSubPresenter.disable();
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
        var jQuerySelectionForUser = function () {
          return that.jquerySelection().find(".user_barcode");
        };

        var jQuerySelectionForLabware = function () {
          return that.jquerySelection().find(".labware_barcode");
        };

        this.userBCSubPresenter.setupPresenter({type:"user", value:""}, jQuerySelectionForUser);
        this.labwareBCSubPresenter.setupPresenter({type:"tube", value:""}, jQuerySelectionForLabware);

        return this;
      },
      setupView:function () {
        this.view = new View(this, this.jquerySelection);
        return this;
      },
      renderView:function () {
        // render view...
        var data = undefined;
        this.view.renderView(data);
        this.userBCSubPresenter.renderView();
        this.labwareBCSubPresenter.renderView();

        return this;
      },
      release:function () {
        this.view.release();

        return this;
      },
      childDone:function (child, action, data) {
        // called when a child  wants to say something...
        var that = this;
        if (child === this.userBCSubPresenter) {
          if (action === "barcodeScanned") {
            that.model.setUserFromBarcode(data.BC);
            this.userBCSubPresenter.disable();
            this.labwareBCSubPresenter.enable();
            this.labwareBCSubPresenter.focus();
            return;
          }
        } else if (child === this.labwareBCSubPresenter) {
          if (action === "barcodeScanned") {
            this.model.setLabwareFromBarcode(data.BC);
            return;
          }
        } else if (child === this.model) {
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

        console.error("unhandled childDone event:");
        console.error("child: ", child);
        console.error("action: " + action);
        console.error("data: " + JSON.stringify(data));
        return this;
      }
    });

    return DefaultPresenter;
  }
);
