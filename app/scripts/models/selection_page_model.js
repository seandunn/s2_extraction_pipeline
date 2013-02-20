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

define([''], function() {

  function SelectionPageModel(user) {
    /* Creates the default implementation of a selection page model
     * with a user identifier and some orders
     *
     * Arguments
     * ---------
     * user: the userId
     * orders: the first order
     */

    this.user = user;
    this.orders = [];
    this.batch = undefined; 

    this.addOrder = function(newOrder) {
      /* add order
       *
       * Adds an order to this batch view.
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
      if (this.orders.length > 11 ) {
	throw {"type": "SelectionPageException", "message" : "Only 12 orders can be selected" };
      }

      if (this.batch === undefined) {
	this.batch = newOrder.rawJson.order.batch;
      }
      else if (newOrder.rawJson.order.batch != this.batch) {
	throw {"type": "SelectionPageException", "message" : "Batch number of new order does not match current selection" };
      }	
      this.orders.push(newOrder);
    };

    this.removeOrderByUuid = function(uuid) {
      /* removes an order matching a given uuid
       *
       * Arguments
       * ---------
       * uuid - the uuid of the order to remove
       */
      for(var i = 0; i < this.orders.length; i++) {
	if(this.orders[i].rawJson.order.uuid == uuid) {
	  this.orders.splice(i, 1);
	  break;
	}
      }

      if (this.orders.length == 0) {
	this.batch = undefined;
      }
    }

    this.getNumberOfOrders = function() {
      /* gets the number of orders
       *
       * Returns
       * -------
       * The number of orders.
       */
      return this.orders.length;
    }

    return this;
  }

  return SelectionPageModel;

});
