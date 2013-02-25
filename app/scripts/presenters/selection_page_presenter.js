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


define(['views/selection_page_view', 'models/selection_page_model', 'dummyresource'], function (SelectionPageView, SelectionPageModel, rsc) {
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

  SelectionPagePresenter.prototype.findAndAddOrder = function() {
    // TODO : later on we should go by uuid
    var that = this;
    var order;
    order_rsc_path = 'components/s2-api-examples/order.json';
    new rsc(order_rsc_path, "read")
        .done(function (s2order) {
          order = s2order;
        })
        .fail(function () {
          // TODO: deal with error reading the order
        })
        .then(function () {
          console.log("order has been found ");
          that.model.addOrder(order);
          that.update();
        });
  }

  SelectionPagePresenter.prototype.setupView = function(selection) {
    /* initialises this instance by instantiating the view
     */
    this.view = new SelectionPageView(this, selection);
    console.log("setting SPP selection");
    this.selection = function() { return $("#content"); };
    this.findAndAddOrder();
    return this;
  }

  SelectionPagePresenter.prototype.addModel = function(userBC) {
    this.model = new SelectionPageModel(userBC);
    this.setupPresenters();
    this.updatePresenters();
    return this;
  }

  SelectionPagePresenter.prototype.update = function() {
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
    this.view.clear();
    this.view.render(this.model);
    this.setupPresenters(this.model, this.view);
    this.updatePresenters(this.model);
    return this;
  };

  SelectionPagePresenter.prototype.setupPresenters = function (model, view) {
    var that = this,
    innerSelection,
    presenter;
    if (!model) {
      return;
    }
    var numOrders = model.getNumberOfOrders();
    for (var i = 0; i < numOrders; i++) {
      // TODO : order presenters go here
    }
    if (numOrders < model.getCapacity()) {
      innerSelection = function() { return that.selection().find("tr :eq(" + numOrders + ")"); }
      presenter = this.presenterFactory.createScanBarcodePresenter(this, innerSelection, "tube");
      presenter.setupView(innerSelection);
      this.presenters[numOrders] = presenter;
    }
  };


  SelectionPagePresenter.prototype.updatePresenters = function (model) {
    if(!model) {
      return;
    }
    var numOrders = model.getNumberOfOrders();
    for (var i = 0; i < numOrders; i++) {
    }
    if (numOrders < model.getCapacity()) {
      this.presenters[numOrders].render();
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

  SelectionPagePresenter.prototype.createPresenters = function() {    
    var numOrders = this.model ? this.model.getNumberOfOrders() : 0;
    if (numOrders < this.model.getCapacity()) {
      var selection = this.view.getRowByIndex(numOrders);
      var presenter = this.partialPresenterFactory.createScanBarcodePresenter(this, selection, "tube");
      this.presenters[numOrders] = presenter;
    }
  }

  SelectionPagePresenter.prototype.updatePresenters = function() {
    for(var i = 0; i < this.presenters.length; i++)
      var presenter = this.presenters[i];
      if(presenter) {	
	presenter.render();
      }
  }

  SelectionPagePresenter.prototype.childDone = function (presenter, action, data) {
    /* Handles done messages from the page view and child presenters.
     *
     * Any messages that happen to come from the PageView will be delegated over to
     * selfDone.
     *
     * Arguments
     * ---------
     * presenter : the presenter instance the done message is coming from. Can be
     *             either the PagePresenter or one of the PartialPresenters
     * action:     a string representing the action request, e.g. 'next' for someone
     *             clicking on the next button
     * data:       Any data associated with the action.
     *
     */
    if (presenter === this) {
      console.log("...?");
      return this.selfDone(action, data);
    }

    if(action === "barcodeScanned") {
      return this.handleBarcodeScanned(presenter, action, data);
      }

    console.log("unhandled childDone event:");
    console.log("presenter: ", presenter);
    console.log("action: " + action);
    console.log("data: " + JSON.stringify(data));
    return this;
  };

  SelectionPagePresenter.prototype.handleBarcodeScanned = function(presenter, action, data) {
    this.findAndAddOrder();
    }

  SelectionPagePresenter.prototype.selfDone = function (action, data) {
    /* Handles done messages that arose from within this object or the view
     *
     * Arguments
     * ---------
     * presenter : the presenter instance the done message is coming from. Can be
     *             either the PagePresenter or one of the PartialPresenters
     * action:     a string representing the action request, e.g. 'next' for someone
     *             clicking on the next button
     * data:       Any data associated with the action.
     *
     */
    if (action == "next") {
      this.owner.childDone(this, "done", data);
    }
    return this;
  };

  return SelectionPagePresenter;
});
