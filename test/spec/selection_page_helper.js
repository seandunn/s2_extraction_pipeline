define(['config', 'mapper/s2_resource'], function(config, S2Resource) {
  config.setTestJson('dna_only_extraction');

  config.currentStage = 'stage1';

  var SelectionPageHelper = function() {
    return this;
  };

  SelectionPageHelper.prototype.createOrderWithOriginalBatch = function (counter) {
    var order;

    new S2Resource('11111111-2222-3333-4444-999999999999').done(function(s2order){
      order = s2order;
    });

    order.rawJson.order.uuid = this.createUuid(counter);

    order.batch = {
      rawJson:{
        uuid: '11111111-222222-00000000-111111111111'
      }
    };

    return order;
  };

  SelectionPageHelper.prototype.createOrderWithDifferentBatch = function(counter) {
    var order                = this.createOrderWithOriginalBatch(counter);
    order.batch.rawJson.uuid = "11111111-2222222-0000000-1111111111112";
    return order;
  };

  SelectionPageHelper.prototype.createUuid = function(counter) {
    var uniquePart = "" + counter;
    var ending = Array(14 - uniquePart.length).join("0") + uniquePart
    return "11111111-2222-3333-4444-" + ending;
  };

  SelectionPageHelper.prototype.getUuidFromOrder = function(order) {
    return order.rawJson.order.uuid;
  };

  return SelectionPageHelper;
});
