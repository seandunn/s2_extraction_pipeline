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


define(['dummyresource', 'default/default_view'], function (rsc, view) {
// TODO: replace the dummy resource with the real one aka the mapper ['mapper/s2_resource'], function(S2Resource) {
  /*
   The default page presenter. Deals with login.
   */


  // interface ....
  var defPtr = function (owner, presenterFactory) {
    this.owner = owner;
    this.currentView = {};
    return this;
  };

  defPtr.prototype.init = function (jquerySelection) {
    this.currentView = new view(this, jquerySelection);
    return this;
  };

  defPtr.prototype.release = function () {
    this.currentView.release();
    return this;
  };

  defPtr.prototype.update = function () {
    this.currentView.update();
    return this;
  };

  defPtr.prototype.childDone = function (childPtr, action, data) {
    // called when a child presenter wants to say something...
    // here, does nothing.
    return {};
  };


  defPtr.prototype.login = function (userBC, tubeBC) {
    // method called when try to login

    var tube;
    var that = this;

    // TODO: for now, the tube is always the same... no use of the mapper
    tubeBC = 'components/apiExample/tube.json';

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
  };

  return defPtr;
});