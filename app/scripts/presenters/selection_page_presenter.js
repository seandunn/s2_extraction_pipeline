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


define(['extraction_pipeline/views/selection_page_view', 'extraction_pipeline/models/selection_page_model', 'extraction_pipeline/dummyresource'], function (SelectionPageView, SelectionPageModel, rsc) {
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
    order_rsc_path = 'components/s2-api-examples/tube.json';
    new rsc(order_rsc_path, "read")
        .done(function (s2order) {
          order = s2order;
        })
        .fail(function () {
          // TODO: deal with error reading the order
        })
        .then(function () {
          console.log("order has been found ");
	  that.handleExtraTube(order);
//          that.render();
        });
  }

  SelectionPagePresenter.prototype.setupView = function(selection) {
    /* initialises this instance by instantiating the view
     */
    this.view = new SelectionPageView(this, selection);
    this.jquerySelector = function() { return $("#content"); };
    return this;
  }

  SelectionPagePresenter.prototype.setModel = function(userBC) {
    this.model = new SelectionPageModel(userBC);
    this.findAndAddOrder();
    return this;
  }

  SelectionPagePresenter.prototype.render = function() {
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
    for(var i = 0; i < this.presenters.length; i++) {
      var presenter = this.presenters[i];
      if(presenter) {
	presenter.render();
      }
    }
    return this;
  };

  SelectionPagePresenter.prototype.setupPresenters = function (model) {
    var that = this;
    if (!model) {
      return;
    }
    var numOrders = model.getNumberOfTubes();
    for (var i = 0; i < numOrders; i++) {
      // TODO : order presenters go here
    }
    this.ensureScanBarcodePresenter(model);
    for(var i = 0; i < this.presenters.length; i++) {
      this.setupChildView(i);
    }
  }

  SelectionPagePresenter.prototype.setupChildView = function (index) {
    var j = index;
    var presenter = this.presenters[index];
    var that = this;
    var innerSelection = function() { return that.jquerySelector().find("tr :eq(" + j  +  ")"); }
    this.presenters[index].setupView(innerSelection);
    this.presenters[index].render();
  }

  SelectionPagePresenter.prototype.setupChildViews = function() {
    for(var i = 0; i < this.presenters.length; i++) {
      this.setupChildView(i);
    }
    this.render();
  }

  SelectionPagePresenter.prototype.ensureTubeRemovalPresenter = function(owner, index){
    var presenter = this.presenterFactory.createTubeRemovalPresenter(this, owner);
    this.presenters[index] = presenter;
    this.setupChildView(index);
    // TODO
  }

  SelectionPagePresenter.prototype.ensureScanBarcodePresenter = function(model) {
    var numTubes = model.getNumberOfTubes();
    console.log("num orders", numTubes);
    if (numTubes < model.getCapacity()) {
      var presenter = this.presenterFactory.createScanBarcodePresenter(this, "tube");
      this.presenters[numTubes] = presenter;
      this.setupChildView(numTubes);
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

    if (action === "barcodeScanned") {
      return this.handleBarcodeScanned(presenter, data);
    } else if (action === "removeTube") {
      return this.handleTubeRemoved(presenter, data);
    }
    

    console.log("unhandled childDone event:");
    console.log("presenter: ", presenter);
    console.log("action: " + action);
    console.log("data: " + JSON.stringify(data));
    return this;
  };

  SelectionPagePresenter.prototype.handleBarcodeScanned = function(presenter, data) {
    this.findAndAddOrder();
    }

  SelectionPagePresenter.prototype.handleTubeRemoved = function(presenter, data) {
    console.log("data is ", data);
    var index = this.model.removeTubeByUuid(data.tube.uuid);
    console.log("index is ", index);
    if (index > -1) {
      this.presenters[index].release();
      this.presenters.splice(index, 1);
      if (this.presenters.length == this.model.getCapacity() - 1) {
	this.ensureScanBarcodePresenter();
      }
      this.setupChildViews();
    }
  }


  SelectionPagePresenter.prototype.handleExtraTube = function(tube) {
    if(this.model) {
      var numTubes = this.model.getNumberOfTubes();
      this.model.addTube(tube);
      if(this.presenters[numTubes]) {
	this.presenters[numTubes].release();
	this.presenters[numTubes] = null;
      }
      this.ensureTubeRemovalPresenter(tube, numTubes);
      this.ensureScanBarcodePresenter(this.model);
      this.setupChildViews();
    }
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
