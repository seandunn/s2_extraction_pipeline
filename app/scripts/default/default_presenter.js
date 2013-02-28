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
    return this;
  };


  defPtr.prototype.setupPresenter = function (input_model, jquerySelection) {
    console.log("defPtr  : setupPresenter");
    this.setupPlaceholder(jquerySelection);

    this.updateModel(input_model);

    this.setupView();
    this.renderView();

    return this;
  };

  defPtr.prototype.updateModel = function (input_model) {
    console.log("defPtr  : updateModel");
    this.model = input_model;
//    var theURL = "http://localhost:8088/tube/2_"+input_model.v;
//    var that = this;
//    $.ajax({url:theURL, type:"GET"}).complete(
//        function (data) {
//          that.model = $.parseJSON(data.responseText);
//          that.setupView();
//          that.renderView();
//          that.setupSubPresenters();
//        }
//    );
    return this;
  };

  defPtr.prototype.setupPlaceholder = function (jquerySelection) {
    console.log("defPtr  : setupPlaceholder");
    this.jquerySelection = jquerySelection;
    return this;
  };

  defPtr.prototype.setupSubPresenters = function () {
    // check with this.model for the needed subpresenters...
    console.log("defPtr  : setupSubPresenter : none");
    return this;
  };

  defPtr.prototype.setupSubModel = function (model,jquerySelection) {
    console.log("defPtr  : setupSubModel : none");
    return this;
  };


  defPtr.prototype.setupView = function () {
    console.log("defPtr  : presenter::setupView : ", this.jquerySelection);
    this.currentView = new view(this, this.jquerySelection);
    return this;
  };




  defPtr.prototype.renderView = function () {
    // render view...
    console.log("defPtr  : presenter::renderView", this.model);
    var data = {};
    if (this.model && this.model.error){
      data.error = this.model.error;
    }
    this.currentView.renderView(data);
    return this;
  };

  defPtr.prototype.release = function () {
    this.currentView.release();
    return this;
  };





  defPtr.prototype.childDone = function (child, action, data) {
    // called when a child presenter wants to say something...
    // here, does nothing.
    if (child === this.currentView) {
      if (action == "enteredLoginDetails"){
        this.model.error = undefined;
        this.login(data.userBC, data.labwareBC);
      }
    }
    return {};
  };


  defPtr.prototype.handleError = function (error) {
    // method called when try to login
    console.log("error");
    this.model.error = error;
  };

  defPtr.prototype.login = function (userBC, tubeBC) {
    // method called when try to login

    var tube;
    var that = this;

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
          if (userBC != "123"){
            var errorDetails = {msg:"Wrong user", data:data};
            that.handleError(errorDetails);
            that.renderView();
          } else {
          that.owner.childDone(that, "login", data);
          }
        });
  };

  return defPtr;
});
