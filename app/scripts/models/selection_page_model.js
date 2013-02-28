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

define(['extraction_pipeline/dummyresource'], function (rsc) {

  var SelectionPageModel = function(owner,user) {
    /* Creates the default implementation of a selection page model
     * with a user identifier and some orders
     *
     * Arguments
     * ---------
     * user: the userId
     * orders: the first order
     */
    this.owner = owner;
    this.user = user;
    this.tubes = [];
    this.batch = undefined;
    this.capacity = 12;
    return this;
  }


  SelectionPageModel.prototype.retrieveTubeDetails = function (index, tubeUUID){
//    console.log('retriveorderdetails');
    var that = this;
    var theRsc;
    rsc_path = 'components/s2-api-examples/tube.json';
    new rsc(rsc_path, "read")
        .done(function (s2rsc) {
          theRsc = s2rsc;
        })
        .fail(function () {
          // TODO: deal with error reading the order
        })
        .then(function () {
          console.log("tube has been found ");
          theRsc.rawJson.tube.uuid = tubeUUID;
          that.tubes[index] = theRsc;


          // NEW HACK
          
          theRsc.rawJson.tube.uuid = tubeUUID;

          /*
          if (index == 0){
            that.tubes[index].rawJson.tube.uuid = "11111111-2222-3333-4444-555555555555";
          }*/
          // END OF HACK



          var data = {index:index, tubeUUID:tubeUUID};
//          console.log(that);
          that.owner.childDone(that,"foundTube",data);
        });
  };

  SelectionPageModel.prototype.retrieveBatchFromUser = function (){
    // For now
//    console.log('retrieveBatchFromUser');

    this.tubes = [];

    // something happens here...

    var listOfTubeUUID = ["1234567890", "34567"];

    for (var i=0; i< listOfTubeUUID.length; i++){
      this.retrieveTubeDetails(i,listOfTubeUUID[i]);


    }

//    var that = this;
//    var theRsc;
//    rsc_path = 'components/s2-api-examples/batch.json';
//    new rsc(rsc_path, "read")
//        .done(function (s2batch) {
//          theRsc = s2batch;
//        })
//        .fail(function () {
//          // TODO: deal with error reading the order
//        })
//        .then(function () {
//          console.log("batch has been found ");
//        });


  };



  SelectionPageModel.prototype.addTube = function (newTubeUUID) {
    /* add tube
     *
     * Adds an tube to this batch.
     *
     * Arguments
     * ---------
     * newOrder: the new tube to add
     *
     * Exceptions
     * ----------
     * SelectionPageException:  If the number of orders is already saturated
     * SelectionPageException:  If the batch id does not match the current order
     *
     */
    if (this.tubes.length > this.capacity - 1) {
      throw {"type":"SelectionPageException", "message":"Only " + this.capacity + " orders can be selected" };
    }

//    if (this.batch === undefined) {
//      this.batch =  newOrder.batch && newOrder.batch.rawJson.uuid;
//    }
//    else if (newOrder.batch.rawJson.uuid !== this.batch) {
//      throw {"type":"SelectionPageException", "message":"Batch number of new order does not match current selection" };
//    }
//    this.orders.push(newOrder);

    var lastTubeIndex = this.tubes.length;
    this.retrieveTubeDetails(lastTubeIndex, newTubeUUID);


  };

  SelectionPageModel.prototype.getTubeUuidFromTubeIndex = function (index) {
    /* reads the uuid corresponding to the tube at the given index
     *
     * Returns
     * -------
     * The uuid of the tube in the orders array at index 'index'
     *
     * Arguments
     * ---------
     * index : the index in the tubes array
     */
    var order = this.tubes[index];
    return order.rawJson.tube.uuid;
  };

  SelectionPageModel.prototype.getCapacity = function () {
    /* gets the capacity of the model
     *
     * Returns
     * -------
     * The capacity
     */
    return this.capacity;
  };

  SelectionPageModel.prototype.removeTubeByUuid = function (uuid) {
    /* removes a tube matching a given uuid
     *
     * Arguments
     * ---------
     * uuid - the uuid of the tube to remove
     */
    var index = -1;

    for (var i = 0; i < this.tubes.length; i++) {
      if (this.tubes[i].rawJson.tube.uuid === uuid) {
        this.tubes.splice(i, 1);
	index = i;
        break;
      }
      
    }

    if (this.tubes.length === 0) {
      this.batch = undefined;
    }

    return index;
  };

  SelectionPageModel.prototype.getNumberOfTubes = function () {
    /* gets the number of tubes
     *
     * Returns
     * -------
     * The number of tubes.
     */
    return this.tubes.length;
  };

  return SelectionPageModel;

});
