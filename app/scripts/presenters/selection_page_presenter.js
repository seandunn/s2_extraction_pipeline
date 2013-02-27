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


define(['views/selection_page_view', 'models/selection_page_model', 'dummyresource', 'presenters/tp', 'presenters/ep'], function (SelectionPageView, SelectionPageModel, rsc, tp, ep) {
  // TODO : add dependency for resource : ..., ... ,'mapper/s2_resource' ], function (...,..., rsc )

  var SelectionPagePresenter = function (owner, presenterFactory) {
    /* constructor
     *
     * Arguments
     * ---------
     * owner : the owner of this presenter. Expected to be the application controller
     */
    this.owner = owner;

    this.view = undefined;
    this.presenterFactory = presenterFactory;
    this.presenters = [];

    return this;
  };

  SelectionPagePresenter.prototype.setupPresenter = function (input_model, jquerySelection) {
    /*
     Arguments:
     input_model = { userBC:"1234567890", labwareBC:"1234567890" }
     */
    console.log("SelectionPagePresenter  : setupPresenter");
    this.setupPlaceholder(jquerySelection);
    this.setupView();
    this.renderView();

    this.updateModel(input_model);
    return this;
  };

  SelectionPagePresenter.prototype.setupPlaceholder = function (jquerySelection) {
    console.log("SelectionPagePresenter  : setupPlaceholder");
    this.jquerySelection = jquerySelection;
    return this;
  };

  SelectionPagePresenter.prototype.setupView = function () {
    /* initialises this instance by instantiating the view
     */
    this.view = new SelectionPageView(this, this.jquerySelection);
//    this.selection = function() { return $("#content"); };
    return this;
  }

  SelectionPagePresenter.prototype.updateModel = function (input_model) {
    /*
     Arguments:
     input_model = {
     userBC:"1234567890",
     labwareBC:"1234567890"
     }
     */

    console.log("SelectionPagePresenter  : updateModel");
    if (!this.model) {
      this.model = new SelectionPageModel(this, input_model);
      this.model.retreiveBatchFromUser();
    }
    return this;
  };


  SelectionPagePresenter.prototype.renderView = function () {
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
    this.view.render(this.model);
    for (var i = 0; i < this.presenters.length; i++) {
      if (this.presenters[i]) {
        this.presenters[i].renderView();
      }
    }
    return this;
  };

  SelectionPagePresenter.prototype.setupSubPresenters = function () {
    console.log("SelectionPagePresenter  : setupSubPresenter");

    var numOrders = this.model ? this.model.getNumberOfOrders() : 0;

    for (var i = 0; i < this.model.getCapacity(); i++) {

      if (i < numOrders) {
        this.presenters[i] = new tp(this);
      } else if (i == numOrders) {
        this.presenters[i] = this.presenterFactory.createScanBarcodePresenter(this, "tube");
      } else {
        this.presenters[i] = new ep(this);

      }
    }
    this.setupSubModel();
    return this;
  };

  SelectionPagePresenter.prototype.setupSubModel = function () {
    /*
     Creates the data needed for the sub presenters
     */
    console.log("SelectionPagePresenter  : setupSubModel");

    var that = this;
    var jQueryForNthChild = function (childIndex) {
      return function () {
        return that.jquerySelection().find("li :eq(" + childIndex + ")");
      }
    };

    if (!this.model) {
      return;
    }

    numOrders = this.model.getNumberOfOrders();
    for (var i = 0; i < numOrders; i++) {
      // TODO : order presenters go here
    }
    //this.setupScanBarcodePresenterForAGivenRow(model);
    for (var i = 0; i < this.presenters.length; i++) {
      if (i < numOrders) {
        this.presenters[i].setupPresenter(undefined, jQueryForNthChild(i));

      } else if (i == numOrders) {
        this.presenters[i].setupPresenter(undefined, jQueryForNthChild(i));
      } else {
        this.presenters[i].setupPresenter(undefined, jQueryForNthChild(i));

      }
    }
  };

  SelectionPagePresenter.prototype.release = function () {
    /* Tells the presenter to get ready for being deleted.
     *
     * This should only be called at the end of the life. It will
     * tell the view component to tell itself to disappear from the
     * open page.
     */
    this.view.clear();
    return this;
  };

  SelectionPagePresenter.prototype.childDone = function (child, action, data) {
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
      if (action === "foundOrder") {
        console.log("childDone");
        this.setupSubPresenters();
        this.renderView();

        return;
      }
    }

    if (action === "barcodeScanned") {
      console.log("barcodeScanned");
      return this.model.addOrder(data);
    }

    console.log("unhandled childDone event:");
    console.log("child: ", child);
    console.log("action: " + action);
    console.log("data: " + JSON.stringify(data));
    return this;
  };

  SelectionPagePresenter.prototype.handleBarcodeScanned = function (presenter, action, data) {
    //this.findAndAddOrder();
  };


  return SelectionPagePresenter;
});
