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

define(['scripts/models/selectionPageModel'], function(SelectionPageModel) {
    'use strict';

    var orderJson={
	"rawJson": {
	    "order": {
		"actions": {
		    "create": "/11111111-2222-3333-4444-555555555555",
		    "read": "/11111111-2222-3333-4444-555555555555",
		    "update": "/11111111-2222-3333-4444-555555555555",
		    "delete": "/11111111-2222-3333-4444-555555555555"
		},
		"uuid": "11111111-2222-3333-4444-555555555555",
		"creator": {
		    "actions": {
			"create": "/11111111-2222-3333-4444-666666666666",
			"read": "/11111111-2222-3333-4444-666666666666",
			"update": "/11111111-2222-3333-4444-666666666666",
			"delete": "/11111111-2222-3333-4444-666666666666"
		    },
		    "uuid": "11111111-2222-3333-4444-666666666666"
		},
		"study": {
		    "actions": {
			"create": "/11111111-2222-3333-4444-777777777777",
			"read": "/11111111-2222-3333-4444-777777777777",
			"update": "/11111111-2222-3333-4444-777777777777",
			"delete": "/11111111-2222-3333-4444-777777777777"
		    },
		    "uuid": "11111111-2222-3333-4444-777777777777"
		},
		"pipeline": "DNA only extraction",
		"cost_code": "cost code 1",
		"status": "in_progress",
		"batch": "001",
		"parameters": {},
		"state": {},
		"items": {
		    "Input Tube": [
			{ "status": "done", "uuid": "11111111-2222-3333-0000-111111111111" }
		    ]
		}
	    }
	}
    };
    
    function createOrderWithOriginalBatch(counter) {
	var order = JSON.parse(JSON.stringify(orderJson));
	order.rawJson.order.uuid = createUuid(counter);
    
	return order;
    }

    function createOrderWithDifferentBatch(counter) {
	var order = createOrderWithOriginalBatch(counter);
	order.rawJson.order.batch = "002";
	return order;
    }

    function createUuid(counter) {
	var uniquePart = "" + counter;
	var ending = Array(14 - uniquePart.length).join("0") + uniquePart
	return "11111111-2222-3333-4444-" + ending;
 
    }

    function getUuidFromOrder(order) {
	return order.rawJson.order.uuid;
    }
    
    describe("SelectionPageModel with user and 0 orders", function() {
	var model;
    
	beforeEach(function() { 
	    model = new SelectionPageModel(123456789);
	});

	it("has no batch identifier", function() {
	    expect(model.batch).toBeUndefined();
	});
	
	it("has batch identifier set after an order has been added", function() {
	    model.addOrder(createOrderWithOriginalBatch(0));
	    expect(model.batch).toEqual('001');
	});
	
    });

    describe("SelectionPage model with user and 1 order", function() {
	var model;
	
	beforeEach(function() { 
	    model = new SelectionPageModel(123456789);
	    model.addOrder(createOrderWithOriginalBatch(0));	
	});
	
	it("contains one order", function() { 
	    expect(model.getNumberOfOrders()).toEqual(1);
	});
	
	it("adding new order in same batch works fine", function () {
	    var order =
		createOrderWithOriginalBatch(1);
	    model.addOrder(order);
	    
	    expect(model.getNumberOfOrders()).toEqual(2);
	    expect(model.orders[0].rawJson.order.uuid).not.toEqual(model.orders[1].rawJson.order.uuid);
	});
	
	it("adding new order in different batch throws exception", function() {	
	    var order = createOrderWithDifferentBatch(1);
	    expect(function() { model.addOrder(order); }).toThrow();
	});
	
	it("removing last order causes batch to be undefined", function() {
	    var uuid = getUuidFromOrder(model.orders[0]);
	    model.removeOrderByUuid(uuid);
	    expect(model.getNumberOfOrders()).toEqual(0);
	    expect(model.batch).toBeUndefined();
	});
    });
    
    describe("selectionPageModel with 12 orders", function() {
	var model;
	
	beforeEach(function() { 
	    model = new SelectionPageModel(123456789);
	    for(var i = 0; i < 12; i++) {
		var newOrder = createOrderWithOriginalBatch(i);
		model.addOrder(newOrder);
	    }
	});
	
	it("contains 12 orders", function() { 
	    expect(model.getNumberOfOrders()).toEqual(12);
	});
	
	it("remove order removes correct order and leaves batch defined", function() {
	    var uuid = getUuidFromOrder(model.orders[5]);
	    var originalBatch = model.batch;
	    model.removeOrderByUuid(uuid);
	    expect(model.getNumberOfOrders()).toEqual(11);
	    for(var i = 0; i < 11; i++) {
		var order = model.orders[i];
		expect(order).toBeDefined();
		expect(getUuidFromOrder(order)).not.toEqual(uuid);	
	    }
	    
	    expect(model.batch).toEqual(originalBatch);
	    
	});
	
	it("attempting to remove an order with no matching uuid leaves model unchanged", function() {
	    var uuid = createUuid(20);
	    model.removeOrderByUuid(uuid);
	    
	    expect(model.getNumberOfOrders()).toEqual(12);
	});
	
	it("adding new order in different batch throws exception", function() {
	    var order = createOrderWithDifferentBatch(12);
	    expect(function() { model.addOrder(order); }).toThrow();
	});
	
	it("adding new order in same batch throws exception", function() {
	    var order = createOrderWithOriginalBatch(12);
	    expect(function() { model.addOrder(order); }).toThrow();
	});
    });

});
