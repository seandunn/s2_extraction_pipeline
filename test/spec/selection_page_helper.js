define(['config', 'mapper/s2_resource', 'json/dna_only_extraction'], function(config, S2Resource, testJson ) {
  config.setTestJson('dna_only_extraction');

  config.currentStage = 'stage1';

  var SelectionPageHelper = function() {
    return this;
  };

  SelectionPageHelper.prototype.createOrderWithNullBatch = function(counter) {
    var order;
    var canonicalUuid = '11111111-2222-3333-4444-999999999999';
    var wantedUuid = this.createUuid(counter);
    config.cpResource(canonicalUuid, wantedUuid);

    new S2Resource(wantedUuid).done(function(s2order){
      order = s2order;
    });

    order.rawJson.order.uuid = this.createUuid(counter);
    
    return order;
  };

  SelectionPageHelper.prototype.createTubeWithNullBatch = function(counter) {
    var tube;
    var canonicalUuid = '11111111-2222-3333-4444-555555555555';
    var wantedUuid = this.createUuid(counter);
    config.cpResource(canonicalUuid, wantedUuid);

    new S2Resource(wantedUuid).done(function(s2tube){
      tube = s2tube;
    });

    tube.rawJson.tube.uuid = this.createUuid(counter);
    
    return tube;
  };
  

  SelectionPageHelper.prototype.createOrderWithOriginalBatch = function (counter) {
    var order = this.createOrderWithNullBatch(counter);
    
    order.batch = {
      rawJson:{
        uuid: '11111111-222222-00000000-111111111111'
      }
    };

    return order;
  };

  SelectionPageHelper.prototype.createTubeWithOriginalBatch = function (counter) {
    var tube = this.createTubeWithNullBatch(counter);
    
    tube.batch = {
      rawJson:{
        uuid: '11111111-222222-00000000-111111111111'
      }
    };

    return tube;
  };

  SelectionPageHelper.prototype.createOrderWithDifferentBatch = function(counter) {
    var order = this.createOrderWithNullBatch(counter);
    order.batch = {
      rawJson:{
        uuid: '11111111-222222-00000000-111111111112'
      }
    };
    
    return order;
  };

  SelectionPageHelper.prototype.createTubeWithDifferentBatch = function (counter) {
    var tube = this.createTubeWithNullBatch(counter);
    
    tube.batch = {
      rawJson:{
        uuid: '11111111-222222-00000000-111111111112'
      }
    };

    return tube;
  };



  SelectionPageHelper.prototype.createUuid = function(counter) {
    var uniquePart = "" + counter;
    var ending = Array(14 - uniquePart.length).join("0") + uniquePart
    return "11111111-2222-3333-4444-" + ending;
  };

  SelectionPageHelper.prototype.getUuidFromOrder = function(order) {
    return order.rawJson.order.uuid;
  };

  SelectionPageHelper.prototype.getUuidFromTube = function(tube) {
    return tube.rawJson.tube.uuid;
  };
  

  return SelectionPageHelper;
});
