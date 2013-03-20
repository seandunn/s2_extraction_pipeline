define([], function () {

  function getKey(e) {
    if (window.event) {
      return window.event.keyCode;
    }
    else if (e) {
      return e.which;
    }
    return null;
  }

  var rowView = function (owner, jquerySelector) {
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  rowView.prototype.removeArrow = function() {
    this.jquerySelector().find('.arrow').empty();
  };

  rowView.prototype.renderView = function (model) {
    if (model !== null) {
      this.model = model;
    }
    else {
      model = this.model;
    }

    var parent = this.jquerySelector(),
      htmlParts = [
        '<div style="position: relative">',
        '<h3 class="rowNum"></h3>',
        '<ul style="overflow: auto">',
        '<li style="float: left"><div class="labware1" style="width:21em;"></div></li>',
        '<li style="float: left;" class="arrow"><div style="font-size: 6em; padding-top: 100px;">&rarr;</div></li>',
        '<li style="float: left;">',
        ' <div style=" width:17em; "><ul><li class="labware2"></li><li class="spinColumnDesc"><p></p></li></ul></div>',
        '</li>',
        '<li style="float: left;"><div class="labware3" style="  width:12em"></div></li>',
//        '<h3 class="rowNum">1</h3>',
//        '<ul class="" style="display: inline">',
//        '<li style="display: inline"><div class="labware1" style="background: red"></div></li>',
//        '<li style="display: inline; font-size: 6em; padding-top: 100px; background: green" class="arrow">&rarr;</li>',
//        '<li style="display: inline">',
//        '<div style="display: inline; background: purple"><ul><li class="labware2"></li><li class="spinColumnDesc"><p></p></li></ul></div>',
//        '</li>',
//        '<listyle="display: inline"><div class="labware3" style="background: blue"></div></li>',
        '</ul>',
        '<div class="labwareDisabled" style="position: absolute; top: 0px; left: 0px; opacity: 0.6; width: 100%; height: 100%; background: #eeeeee; z-index: 3; display: none;"></div></div>'],
      htmlString = htmlParts.join('');

//      htmlString = "<ul  style='display: inline'><li style='display: inline'>hello</li><li style='display: inline'>hello</li></ul>"

    // We have to append to the document or events won't register
    parent.empty().
      append(htmlString);
  };

//
//  ScanBarcodeView.prototype.getError = function(model) {
//    var errorMessage = model.customError;
//    if (!errorMessage && !model.isValid()) {
//      errorMessage = "Invalid barcode entered";
//    }
//    return errorMessage ? '<p class="alert-error">' + errorMessage + '</p>' : '';
//  }


  rowView.prototype.clear = function () {
    /* clear the view from the current page
     */
    var children = this.jquerySelector().empty();
  };

  return rowView;

});
