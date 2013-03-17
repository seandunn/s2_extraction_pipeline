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
  , 'mapper/s2_root'
  , 'text!components/S2Mapper/test/json/unit/root.json'
], function (config, BasePresenter, SelectionPageView, SelectionPageModel, S2Root, rootTestJson) {

  var PagePresenter = Object.create(BasePresenter);

  $.extend(PagePresenter, {

    setupPresenter:function (input_model, jquerySelection) {
      /*
       Arguments:
       input_model = { userUUID:"1234567890", labwareUUID:"1234567890", batchUUID:"0123456789" }
       */
      this.model = new SelectionPageModel(this, input_model);
      this.setupPlaceholder(jquerySelection);
      this.setupView();
      this.renderView();
      this.setupSubPresenters();

      return this;
    },
    setupView:function () {
      /* initialises this instance by instantiating the view
       */
      this.view = new SelectionPageView(this, this.jquerySelection);
      return this;
    },

    renderView:function () {
      /* Updates the data for the current view
       *
       * Tells the presenter that the model has been updated
       *
       */

      if (!this.view) {
        return this;
      }

      // we need to render the model first, so that the html elements
      // exist to configure the sub-presenters' views
      var dataForView = {
        batch:this.model.batch && this.model.batch.uuid,
        user:this.model.userUUID,
        capacity:this.model.getCapacity()
      };
      this.view.render(dataForView);
      if (!this.presenters){
        this.presenters = [];
      }
      for (var i = 0; i < this.presenters.length; i++) {
        if (this.presenters[i]) {
          this.presenters[i].renderView();
        }
      }
      return this;
    },

    setupSubPresenters:function () {
      var numOrders = this.model ? this.model.getNumberOfTubes() : 0;

      for (var i = 0; i < this.model.getCapacity(); i++) {
        this.presenters[i] = this.presenterFactory.createLabwarePresenter(this);
      }
      this.setupSubModel();
      return this;
    },

    setupSubModel:function () {
      /*
       Creates the data needed for the sub presenters
       */
      var that = this;
      var jQueryForNthChild = function (childIndex) {
        return function () {
          return that.jquerySelection().find("li :eq(" + childIndex + ")");
        };
      };

      if (!this.model) {
        return;
      }

      numTubes = this.model.getNumberOfTubes();

      for (var i = 0; i < this.model.getCapacity(); i++) {
        if (i < numTubes) {
          var dataForExistingLabware_presenter = { "resource":this.model.tubes[i],
            "display_remove":true,
            "display_barcode":false};
          this.presenters[i].setupPresenter(dataForExistingLabware_presenter, jQueryForNthChild(i));
        } else if (i == numTubes) {
          var dataForLabwareWithBC_presenter = {"display_remove":false, "display_barcode":true};
          this.presenters[i].setupPresenter(dataForLabwareWithBC_presenter, jQueryForNthChild(i));
        } else {
          var dataForhiddenLabwarePresenter = {"display_remove":false, "display_barcode":false};
          this.presenters[i].setupPresenter(dataForhiddenLabwarePresenter, jQueryForNthChild(i));

        }
      }

    },

    release:function () {
      /* Tells the presenter to get ready for being deleted.
       *
       * This should only be called at the end of the life. It will
       * tell the view component to tell itself to disappear from the
       * open page.
       */
      this.view.clear();
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
      if (child === this.model) {
        if (action === "modelUpdated") {
          this.owner.HACK_add_global_tube_uuids(this.model.tubeUUIDs);

          this.setupSubPresenters();
          this.renderView();

          return;
        }
      }

      if (action === "barcodeScanned") {
        return this.handleBarcodeScanned(data.BC);
      } else if (action === "labwareRemoved") {
        return this.handleTubeRemoved(data.uuid);
//      } else if (action === "next") {
//        console.warn("CALL TO S2MAPPER: CREATING BATCH");
//        var root;
//        var batch;
//        config.setupTest(rootTestJson); // TODO: remove this line to activate the real mapper
//        S2Root.load().done(function (result) {
//          root = result;
//        }).fail(function () {
//              console.log("root load failed");
//            }).then(function () {
//              batch = root.batches.new({items:[ "3bcf8010-68ac-0130-9163-282066132de2",
//                "3bcf8010-68ac-0130-9163-282066132de2" ]
//              });
//              // todo : save the new batch
//            });
//
//        var newBatchUUID = "0147852369";
//
//        var dataForOwner = {
//          batchUUID:newBatchUUID
//        };
//        return this.owner.childDone(this, "done", dataForOwner);
      }
    },

    handleBarcodeScanned:function (barcode) {
      var that = this;
      this.getLabwareResourcePromise({barcode:barcode})
          .then(function(rsc){
            that.model.addTube(rsc);
          });
      return this;
    },

    handleTubeRemoved:function (data) {
      this.model.removeTubeByUuid(data);
      return this;
    }
  });

  return PagePresenter;
});
