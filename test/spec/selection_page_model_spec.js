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

define(['scripts/models/selection_page_model', 'spec/selection_page_helper'],
       function(SelectionPageModel, SelectionPageHelper) {
  'use strict';
  
  describe("SelectionPageModel", function() {

    var helper = new SelectionPageHelper();

    describe("model with user and 0 orders", function() {
      var model;
      
      beforeEach(function() { 
	model = new SelectionPageModel(123456789);
      });
      
      it("has no batch identifier", function() {
	expect(model.batch).toBeUndefined();
      });
      
      it("has batch identifier set after an order has been added", function() {
	model.addOrder(helper.createOrderWithOriginalBatch(0));
	expect(model.batch).toEqual('001');
      });
      
    });
    
    describe("model with user and 1 order", function() {
      var model;
      
      beforeEach(function() { 
	model = new SelectionPageModel(123456789);
	
	model.addOrder(helper.createOrderWithOriginalBatch(0));	
      });
      
      it("contains one order", function() { 
	expect(model.getNumberOfOrders()).toEqual(1);
      });
      
      it("adding new order in same batch works fine", function () {
	var order = helper.createOrderWithOriginalBatch(1);
	model.addOrder(order);
	
	expect(model.getNumberOfOrders()).toEqual(2);
	expect(model.orders[0].rawJson.order.uuid).not.toEqual(model.orders[1].rawJson.order.uuid);
      });
      
      it("adding new order in different batch throws exception", function() {	
	var order = helper.createOrderWithDifferentBatch(1);
	expect(function() { model.addOrder(order); }).toThrow();
      });
      
      it("removing last order causes batch to be undefined", function() {
	var uuid = helper.getUuidFromOrder(model.orders[0]);
	model.removeOrderByUuid(uuid);
	expect(model.getNumberOfOrders()).toEqual(0);
	expect(model.batch).toBeUndefined();
      });
    });
    
    describe("model with 12 orders", function() {
      var model;
      
      beforeEach(function() { 
	model = new SelectionPageModel(123456789);
	for(var i = 0; i < 12; i++) {
	  var newOrder = helper.createOrderWithOriginalBatch(i);
	  model.addOrder(newOrder);
	}
      });
      
      it("contains 12 orders", function() { 
	expect(model.getNumberOfOrders()).toEqual(12);
      });
      
      it("remove order removes correct order and leaves batch defined", function() {
	var uuid = helper.getUuidFromOrder(model.orders[5]);
	var originalBatch = model.batch;
	model.removeOrderByUuid(uuid);
	expect(model.getNumberOfOrders()).toEqual(11);
	for(var i = 0; i < 11; i++) {
	  var order = model.orders[i];
	  expect(order).toBeDefined();
	  expect(helper.getUuidFromOrder(order)).not.toEqual(uuid);	
	}
	
	expect(model.batch).toEqual(originalBatch);
	
      });
      
      it("attempting to remove an order with no matching uuid leaves model unchanged", function() {
	var uuid = helper.createUuid(20);
	model.removeOrderByUuid(uuid);
	
	expect(model.getNumberOfOrders()).toEqual(12);
      });
      
      it("adding new order in different batch throws exception", function() {
	var order = helper.createOrderWithDifferentBatch(12);
	expect(function() { model.addOrder(order); }).toThrow();
      });
      
      it("adding new order in same batch throws exception", function() {
	var order = helper.createOrderWithOriginalBatch(12);
	expect(function() { model.addOrder(order); }).toThrow();
      });
    })});

});
