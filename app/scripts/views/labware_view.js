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

  var LabwareView = function (owner, jquerySelector) {
    console.log("hello");
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };

  LabwareView.prototype.renderView = function (model) {
    if (model !== null) {
      this.model = model;
    }

    var parent = this.jquerySelector(),
      htmlParts = [
        '<h3 class="title"></h3>',
        '<div class="resource" style="position: absolute; float:left; z-index: 1;"></div>',
        '<button class="removeButton" style="position: relative; float: right; margin-right: 20px; z-index: 2;">X</button>',
        '<div class="barcodeScanner" style="padding-top: 150px"></div>'],
      htmlString = htmlParts.join('');

    // We have to append to the document or events won't register
    parent.empty().append(htmlString);

    var removeButton = parent.find('.removeButton');
    var input = parent.find("input");
    var that = this;

    input.on("keypress", function (e) {
      var key = getKey(e);
      if (key === 13) {
        that.owner.childDone(this.owner, "barcodeScanned", this.value);
      }
    });

    removeButton.on("clicked", function (e) {
      that.owner.resetLabware();
    });
  };

  LabwareView.prototype.hideRemoveButton = function () {
    this.jquerySelector().find('.removeButton').css('display', 'none');
  };

  LabwareView.prototype.setTitle = function (titleString) {

    var title = '';

    switch (titleString) {
      case 'tube':
        title = 'Tube';
        break;
      case 'spin_columns':
        title = 'Spin Column';
        break;
      case 'waste_tube':
        title = 'Waste Tube';
        break;
    };

    this.jquerySelector().find('.title').empty().append(title);
  };
//
//  ScanBarcodeView.prototype.getError = function(model) {
//    var errorMessage = model.customError;
//    if (!errorMessage && !model.isValid()) {
//      errorMessage = "Invalid barcode entered";
//    }
//    return errorMessage ? '<p class="alert-error">' + errorMessage + '</p>' : '';
//  }


  LabwareView.prototype.clear = function () {
    /* clear the view from the current page
     */
    this.jquerySelector().empty();
  };

  return LabwareView;

});
