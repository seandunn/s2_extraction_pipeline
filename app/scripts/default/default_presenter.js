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


define(['extraction_pipeline/dummyresource', 'extraction_pipeline/default/default_view'], function (rsc, view) {
// TODO: replace the dummy resource with the real one aka the mapper ['mapper/s2_resource'], function(S2Resource) {
  /*
   The default page presenter. Deals with login.
   */


  // interface ....
  var defPtr = function (owner, presenterFactory) {
    this.owner = owner;
    this.currentView = undefined;
    this.presenterFactory = presenterFactory;
    this.userBCSubPresenter = undefined;
    this.labwareBCSubPresenter = undefined;
    return this;
  };


  defPtr.prototype.setupPresenter = function (input_model, jquerySelection) {
    console.log("defPtr  : setupPresenter");
    this.setupPlaceholder(jquerySelection);
    this.setupView();
    this.renderView();

    this.updateModel(input_model);
    return this;
  };

  defPtr.prototype.updateModel = function (input_model) {
    console.log("defPtr  : updateModel");
    this.model = input_model;
    if (this.model){

      // TODO: fix me -> eventually use a proper resource to check the user...
//      var theURL = "http://localhost:8088/tube/2_" + input_model.v;
//      var that = this;
//      $.ajax({url:theURL, type:"GET"}).complete(
//          function (data) {
//            that.model = $.parseJSON(data.responseText);
//            that.setupView();
//            that.renderView();
//            that.setupSubPresenters();
//          }
//      );
    }
    this.setupSubPresenters();
    return this;
  };

  defPtr.prototype.setupPlaceholder = function (jquerySelection) {
    console.log("defPtr  : setupPlaceholder");
    this.jquerySelection = jquerySelection;
    return this;
  };

  defPtr.prototype.setupSubPresenters = function () {
    // check with this.model for the needed subpresenters...
    console.log("defPtr  : setupSubPresenter");
    this.userBCSubPresenter = this.presenterFactory.createScanBarcodePresenter(this);
    this.labwareBCSubPresenter = this.presenterFactory.createScanBarcodePresenter(this);
    this.setupSubModel();
    return this;
  };

  defPtr.prototype.setupSubModel = function () {
    console.log("defPtr  : setupSubModel");
    var that = this;
    var jQuerySelectionForUser = function () {
      return that.jquerySelection().find(".user_barcode");
    };

    var jQuerySelectionForLabware = function () {
      return that.jquerySelection().find(".labware_barcode");
    };

    if (this.userBCSubPresenter) {
      this.userBCSubPresenter.setupPresenter({type:"user",value:"user0001"}, jQuerySelectionForUser);
    }
    if (this.labwareBCSubPresenter) {
      this.labwareBCSubPresenter.setupPresenter({type:"tube",value:"tube0001"}, jQuerySelectionForLabware);
    }
    return this;
  };


  defPtr.prototype.setupView = function () {
    console.log("defPtr  : presenter::setupView");
    this.currentView = new view(this, this.jquerySelection);
    return this;
  };


  defPtr.prototype.renderView = function () {
    // render view...
    console.log("defPtr  : presenter::renderView");
    var data = undefined;
    if (this.model) {
      data = {};
      data.error = "hello";
    }
    this.currentView.renderView(data);
    if (this.userBCSubPresenter){
      this.userBCSubPresenter.renderView();
    }
    return this;
  };

  defPtr.prototype.release = function () {
    this.currentView.release();
    return this;
  };


  defPtr.prototype.childDone = function (child, action, data) {
    // called when a child  wants to say something...

    if (child === this.userBCSubPresenter){
      if (action === "barcodeScanned") {
        return this.handleBarcodeScanned(data);
      }
    } else if (child === this.view){
      if (action === "login"){
        this.login(data.userBC, data.labwareBC);
      }
    }
//    else if (action === "next"){
//      return this.owner.childDone(child, "done", data);
//    }

    console.log("unhandled childDone event:");
    console.log("child: ", child);
    console.log("action: " + action);
    console.log("data: " + JSON.stringify(data));
    //return this.owner.childDone(child, action, data);
    return this;
  };


  defPtr.prototype.login = function (userBC, tubeBC) {
    // method called when try to login

    var tube;
    var that = this;

    if (!userBC){
      console.log("something wrong happened with the user");
      return this;
    }
    if (!tubeBC){
      console.log("something wrong happened with the tube");
      return this;
    }

    // TODO: for now, the tube is always the same... no use of the mapper
    tubeBC = 'components/s2-api-examples/tube.json';

    new rsc(tubeBC, "read")
        .done(function (s2tube) {
          tube = s2tube;
        })
        .fail(function () {
          // TODO: deal with error reading the tube
        })
        .then(function () {
          console.log("tube has been found ");
          console.log(tube);
          var data = {userBC:userBC, labwareBC:tube.rawJson.tube.uuid, batchUUID:""};
          console.log(data);
          console.log(that);
          that.owner.childDone(that, "login", data);
        });
    return this;
  };

  return defPtr;
});
