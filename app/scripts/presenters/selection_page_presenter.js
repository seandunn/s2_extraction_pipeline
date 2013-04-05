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


define([ 'config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/views/selection_page_view'
  , 'extraction_pipeline/models/selection_page_model'
], function (config, BasePresenter, SelectionPageView, SelectionPageModel ) {

  var PagePresenter = Object.create(BasePresenter);

  $.extend(PagePresenter, {
    init:function (owner, presenterFactory) {
      this.presenterFactory = presenterFactory;
      this.owner = owner;
      return this;
    },
    setupPresenter:function (setupData, jquerySelection) {
      this.setupPlaceholder(jquerySelection);
      this.pageModel = Object.create(SelectionPageModel).init(this);
      if (setupData) {
        this.pageModel.setBatch(setupData.batch); // the batch BEFORE the labware!
        this.pageModel.setSeminalLabware(setupData.labware);
        this.pageModel.setUser(setupData.userUUID);
        // for test purposes only
//        if (this.pageModel.tubes.length == 1){
//          console.log("fast forward activated");
//          this.pageModel.addTubeFromBarcode("1220017279668");
//          this.pageModel.makeBatch();
//          return this;
//        }
      }
      this.setupView();
      this.setupSubPresenters();
      this.renderView();
      return this;
    },
    setupView:function () {
      this.currentView = new SelectionPageView(this, this.jquerySelection);
      return this;
    },
    renderView:function () {
      if (!this.currentView) {
        return this;
      }
      //marshalling data for the view
      var dataForView = {
        batch:this.pageModel.batch && this.pageModel.batch.uuid,
        user:this.pageModel.user,
        capacity:this.pageModel.getCapacity()
      };
      this.currentView.render(dataForView);
      // render subviews...
      for (var i = 0; i < this.presenters.length; i++) {
        if (this.presenters[i]) {
          this.presenters[i].renderView();
        }
      }
      return this;
    },
    setupSubPresenters:function () {
      this.presenters = [];
      for (var i = 0; i < this.pageModel.getCapacity(); i++) {
        var subPresenter = this.presenterFactory.createLabwarePresenter(this);
        this.presenters.push(subPresenter);
      }
      this.setupSubModel();
      return this;
    },

    setupSubModel:function () {
      var that = this;
      var jQueryForNthChild = function (childIndex) {
        return function () {
          return that.jquerySelection().find("li :eq(" + childIndex + ")");
        };
      };

      if (!this.pageModel) {
        return;
      }

      var numTubes = this.pageModel.getNumberOfTubes();

      for (var i = 0; i < this.pageModel.getCapacity(); i++) {
        if (i < numTubes) {
          var dataForExistingLabware_presenter = {
            "resource":this.pageModel.tubes[i],
            "display_remove":true,
            "display_barcode":false
          };
          this.presenters[i].setupPresenter(dataForExistingLabware_presenter, jQueryForNthChild(i));
        } else if (i == numTubes) {
          var dataForLabwareWithBC_presenter = {
            "display_remove":false,
            "display_barcode":true
          };
          this.presenters[i].setupPresenter(dataForLabwareWithBC_presenter, jQueryForNthChild(i));
        } else {
          var dataForhiddenLabwarePresenter = {
            "display_remove":false,
            "display_barcode":false
          };
          this.presenters[i].setupPresenter(dataForhiddenLabwarePresenter, jQueryForNthChild(i));
        }
      }
    },

    displayBarcodeError:function (message) {
      //numTubes is the index number of the barcode input view in the array of presenters
      var numTubes = this.pageModel.getNumberOfTubes();
      this.presenters[numTubes].displayErrorMessage(message);
    },

    release:function () {
      if (this.currentView) {
        this.currentView.clear();
      }
      return this;
    },

    childDone:function (child, action, data) {
      /* Handles done messages from the page view and child presenters.
       *
       * Any messages that happen to come from the PageView will be delegated over to
       * selfDone.
       *
       * Arguments
       * ---------
       * child : the presenter(or model) instance the done message is coming from. Can be
       *             either the PagePresenter, one of the PartialPresenters or the model
       * action:     a string representing the action request, e.g. 'next' for someone
       *             clicking on the next button
       * data:       Any data associated with the action.
       *
       */
      if (child === this.currentView){
        if (action === "next") {
          //this.owner.childDone(this,"error",{"message" : "Not hooked up!"});
          this.pageModel.makeBatch();
        }
      } else if (child === this.pageModel) {
        if (action === "modelUpdated") {
          // TODO: use the data provided by the model to only update the relevant subpresenters...
          this.setupSubPresenters();
          this.renderView();


        } else if (action === "batchSaved") {
          var dataForOwner = {
            userUUID:this.pageModel.user,
            labware:this.pageModel.labware,
            "batch":this.pageModel.batch
          };
          this.owner.childDone(this,"done",dataForOwner);
        } else if (action === "barcodeNotFound") {
          this.displayBarcodeError("Barcode not found");
        }
      } else {
        if (action === "barcodeScanned") {
          this.pageModel.addTubeFromBarcode(data.BC);
        } else if (action === "removeLabware") {
          this.pageModel.removeTubeByUuid(data.uuid);
        }
      }
    }
  });

  return PagePresenter;
});
