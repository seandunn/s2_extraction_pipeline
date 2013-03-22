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
    this.owner = owner;
    this.jquerySelector = jquerySelector;

    return this;
  };


  function onRemoved_clicked(owner, view) {
    /*
     * response to the click on the login button...
     * tells the owner that we want to try a login
     */
    return function () {
      if (owner) {
        var userbarcode = $(".user_barcode input").val();
        var tube_barcode = $(".labware_barcode input").val();

        owner.childDone(view , "login",{ userBC:userbarcode, labwareBC:tube_barcode });
      }
    }
  }

  LabwareView.prototype.renderView = function (model) {
    if (model !== null) {
      this.model = model;
    }

    var parent = this.jquerySelector(),
      htmlParts = [
        '<div style="height:100%; position:relative; width:100%;">',
        '<h3 class="title"></h3>',
        '<div style="height:100%; position:relative; width:100%;">',
        '<div class="alert alert-success" style="top: 3em; opacity: 0.9; position: absolute; max-width: 9em; display: none; z-index: 4;">',
        '</div>',
        '<button class="btn btn-small removeButton" style="position: absolute; right: 20px; z-index: 2;">X</button>',
        '<div class="resource" style="position: relative; left: 0px; z-index: 1;"></div></div>',
        '<div class="barcodeScanner"></div>',
        '<div class="labwareDisabled" style="position: absolute; top: 0px; left: 0px; opacity: 0.6; width: 100%; height: 100%; background: #eeeeee; z-index: 3; display: none;"></div></div>'],
      htmlString = htmlParts.join('');

    // We have to append to the document or events won't register
    parent.empty().append(htmlString);

    var removeButton = parent.find('.removeButton');
    var that = this;

    removeButton.on("click", function (e) {
      that.owner.childDone(that, "labwareRemoved");
    });
  };

  LabwareView.prototype.hideRemoveButton = function () {
    this.jquerySelector().find('.removeButton').css('display', 'none');
  };

  LabwareView.prototype.labwareEnabled = function(isEnabled) {
    var selection = this.jquerySelector().find('.labwareDisabled');
    var display = isEnabled ? 'none' : 'block';

    selection.css('display', display);

    return this;
  }

  LabwareView.prototype.displaySuccessMessage = function(message) {

    var selection = this.jquerySelector().find('.alert-success');

    var tmp = '<h4 class="alert-heading">Success!</h4>';

    if (message) {
      tmp += message;
    }

    selection.empty().append(tmp);
    selection.css('display', 'block');
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
