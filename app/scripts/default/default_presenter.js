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
  , 'text!components/S2Mapper/test/json/dna_and_rna_manual_extraction_2.json'
],
    function (config, BasePresenter, view, DefaultPageModel, dataJSON) {
      /*
       The default page presenter. Deals with login.
       */

      var DefaultPresenter = Object.create(BasePresenter);

      $.extend(DefaultPresenter, {
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
//          this.pageModel.dirtySetup(); // TODO: remove me, I'm a hack
//          return this;
          this.setupView();
          this.setupSubPresenters();
          this.renderView();

          return this;
        },
        setupSubPresenters:function () {
          // check with this.model for the needed subpresenters...
          this.userBCSubPresenter = this.presenterFactory.createScanBarcodePresenter(this);
          this.labwareBCSubPresenter = this.presenterFactory.createScanBarcodePresenter(this);
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
            this.userBCSubPresenter.setupPresenter({type:"user", value:"XX111111K"}, jQuerySelectionForUser);
          }
          if (this.labwareBCSubPresenter) {
            this.labwareBCSubPresenter.setupPresenter({type:"tube", value:"XX111111K"}, jQuerySelectionForLabware);
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
          if (child === this.labwareBCSubPresenter) {
            if (action === "barcodeScanned") {
              this.pageModel.setLabwareFromBarcode(data.BC);
              return;
            }
          } else if (child === this.userBCSubPresenter) {
            if (action === "barcodeScanned") {
              that.pageModel.setUserFromBarcode(data.BC);
              return;
            }
//          } else if (child === this.currentView) {
//            if (action === "login") {
//              var dataForLogin = {
//                userBC:data.userBC,
//                labwareBC:data.labwareBC
//              };
//              this.login(dataForLogin);
//              return;
//            }
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
