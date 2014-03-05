define([
  "text!app-components/admin/_statusMgmt.html",
  "app-components/labelling/scanning"
], function (partialStatus, barcodeScanner) {
  "use strict";

  var template= _.template(partialStatus);
  
  return function(context) {
    function hashCode(s){
      return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
    }
    var html = $("<div></div>"); //  = template(context);
    var obj = {
      view:   html,
      events: {},
      render: _render
    };

    function _render(barcode) {
      var obj = this;
      
      
      // The user needs to scan themselves in before doing anything
      var itemComponent = barcodeScanner({
        label: "Item",
        icon: "icon-barcode"
      });
      var $div = obj.view;
      $div.append(itemComponent.view);
      $div.on(itemComponent.events);
      $div.on("scanned.barcode.s2", _.bind(function(event, barcode) {
        loadTable.call(this, barcode);
      }, obj));

      if (barcode) {
        loadTable(barcode);
      }
      function loadTable(barcode) {
    app.fetchLabware(barcode).then(function(labware) {
      app.showOrdersUUID(barcode).then(function(orders) {
        var pos = -1;
        var rows = _.chain(orders).map(function(order) {
          return _.map(_.pairs(order.items), function(list) {
            var roleName = list[0], itemList = list[1];
            return _.map(_.filter(itemList, function(item) {
              return item.uuid===labware.uuid;
            }), function(item) {
              pos = pos +1;              
            return {
              className: "item-"+pos,
              role: roleName,
              status: item.status,
              batch: item.batch && hashCode(item.batch.uuid),
              order: hashCode(item.order.uuid),
              sendEvent: order.sendEvent
            };
            });
          });
          //_.reduce(order.items, function(item) {}, []);
        }).flatten().value();
        obj.view.html(template({ items: rows}));
        _.each(rows, function(row) {
          $("."+row.className+" button").on("click", _.partial(function(row) {
            row.sendEvent($("."+row.className+" select").val(), row.role);
            obj.render(barcode);
          }, row));
        });
      });      
    });
    }
    }
    obj.render();
    //obj.render("2070003483672");
    return obj;
  };
});

