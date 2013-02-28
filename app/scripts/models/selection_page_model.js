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

define(['dummyresource'], function (rsc) {

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


  SelectionPageModel.prototype.retreiveOrderDetails = function (index, orderUUID){
    console.log('retriveorderdetails');
    var that = this;
    var theRsc;
    rsc_path = 'components/s2-api-examples/order.json';
    new rsc(rsc_path, "read")
        .done(function (s2order) {
          theRsc = s2order;
        })
        .fail(function () {
          // TODO: deal with error reading the order
        })
        .then(function () {
          console.log("order has been found ");
          that.orders[index] = theRsc;
          var data = {index:index, orderUUID:orderUUID};
          console.log(that);
          that.owner.childDone(that,"foundOrder",data);
        });
  };

  SelectionPageModel.prototype.retreiveBatchFromUser = function (){
    // For now
    console.log('retreiveBatchFromUser');

    this.orders = [];

    // something happens here...

    var listOfOrderUUID = ["1234567890", "34567"];

    for (var i=0; i< listOfOrderUUID.length; i++){
      this.retreiveOrderDetails(i,listOfOrderUUID[i]);
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



  //SelectionPageModel.prototype.addOrder = function (orderUUID) {
  SelectionPageModel.prototype.addTube = function (newTubeUUID) {
    /* add order
     *
     * Adds an order to this batch.
     *
     * Arguments
     * ---------
     * newOrder: the new order to add
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
    this.retreiveTubeDetails(lastTubeIndex, newTubeUUID);


  };

  SelectionPageModel.prototype.getTubeUuidFromTubeIndex = function (index) {
    /* reads the uuid corresponding to the order at the given index
     *
     * Returns
     * -------
     * The uuid of the order in the orders array at index 'index'
     *
     * Arguments
     * ---------
     * index : the index in the orders array
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
    /* removes an order matching a given uuid
     *
     * Arguments
     * ---------
     * uuid - the uuid of the order to remove
     */
    var index = -1;

    for (var i = 0; i < this.tubes.length; i++) {
      if (this.tubes[i].rawJson.tube.uuid == uuid) {
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
    /* gets the number of orders
     *
     * Returns
     * -------
     * The number of orders.
     */
    return this.tubes.length;
  };

  return SelectionPageModel;

});
