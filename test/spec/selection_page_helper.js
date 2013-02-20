define([], function() {

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

  var SelectionPageHelper = function() {
    return this;
  };
  
  SelectionPageHelper.prototype.createOrderWithOriginalBatch = function (counter) {
    var order = JSON.parse(JSON.stringify(orderJson));
    order.rawJson.order.uuid = this.createUuid(counter);
    
    return order;
  }
  
  SelectionPageHelper.prototype.createOrderWithDifferentBatch = function(counter) {
    var order = this.createOrderWithOriginalBatch(counter);
    order.rawJson.order.batch = "002";
    return order;
  }
  
  SelectionPageHelper.prototype.createUuid = function(counter) {
    var uniquePart = "" + counter;
    var ending = Array(14 - uniquePart.length).join("0") + uniquePart
    return "11111111-2222-3333-4444-" + ending;
  }
  
  SelectionPageHelper.prototype.getUuidFromOrder = function(order) {
    return order.rawJson.order.uuid;
  }

  return SelectionPageHelper;
});
