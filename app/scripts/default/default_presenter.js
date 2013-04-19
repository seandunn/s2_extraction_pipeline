/*
 * S2 - An open source lab information management systems (LIMS)
 * Copyright (C) 2013  Wellcome Trust Sanger Insitute
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 1, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston MA  02110-1301 USA
 */


define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/default/default_view'
  , 'extraction_pipeline/default/default_model'
],
    function (config, BasePresenter, view, DefaultPageModel) {
      /*
       The default page presenter. Deals with login.
       */

      var DefaultPresenter = Object.create(BasePresenter);

      $.extend(DefaultPresenter, {
        register: function(callback) {
          callback('default', function(owner, factory, initData) {
            return Object.create(DefaultPresenter).init(owner, factory, initData);
          });
        },

        init:function (owner, presenterFactory) {
          this.presenterFactory = presenterFactory;
          this.owner = owner;
          return this;
        },
        /*
         input_model =
         {
         userBC : "1234567890"
         labware : "1234567890"
         }
         */
        setupPresenter:function (setupData, jquerySelection) {
          this.setupPlaceholder(jquerySelection);
          this.pageModel = Object.create(DefaultPageModel).init(this);
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

          if (this.userBCSubPresenter) {
            this.userBCSubPresenter.setupPresenter({type:"user", value:"1220017279667"}, jQuerySelectionForUser);
          }
          if (this.labwareBCSubPresenter) {
            this.labwareBCSubPresenter.setupPresenter({type:"tube", value:"1220017279667"}, jQuerySelectionForLabware);
          }
          return this;
        },
        setupView:function () {
          this.currentView = new view(this, this.jquerySelection);
          return this;
        },
        renderView:function () {
          // render view...
          var data = undefined;
          this.currentView.renderView(data);
          if (this.userBCSubPresenter) {
            this.userBCSubPresenter.renderView();
          }
          if (this.labwareBCSubPresenter) {
            this.labwareBCSubPresenter.renderView();
          }
          return this;
        },
        release:function () {
          if (this.currentView) {
            this.currentView.release();
          }
          return this;
        },
        childDone:function (child, action, data) {
          // called when a child  wants to say something...
          var that = this;
          if (child === this.userBCSubPresenter) {
            if (action === "barcodeScanned") {
              that.pageModel.setUserFromBarcode(data.BC);
              this.userBCSubPresenter.disable();
              this.labwareBCSubPresenter.enable();
              this.labwareBCSubPresenter.focus();
              return;
            }
          } else if (child === this.labwareBCSubPresenter) {
            if (action === "barcodeScanned") {
              this.pageModel.setLabwareFromBarcode(data.BC);
              return;
            }
          } else if (child === this.pageModel) {
            switch (action) {
              case "modelUpdated":
                if (this.currentView) {
                  this.setupSubPresenters();
                  this.renderView();
                }
                break;
              case "modelValidated":
                var dataForOwner = {
                  userUUID:this.pageModel.user,
                  labware:this.pageModel.labware,
                  "batch":this.pageModel.batch
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
