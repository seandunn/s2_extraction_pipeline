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


define([
  'extraction_pipeline/views/row_view'
  , 'labware/presenters/tube_presenter'
  , 'extraction_pipeline/presenters/base_presenter'
], function (View, TubePresenter, BasePresenter) {

  /* Sample model input:
   *
   *{
   * "rowNum" : i,
   * "labware1" : {
   *   "uuid" : this.model[i],
   *   "expected_type" : "tube",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * },
   * "labware2" : {
   *   "expected_type" : "spin_column",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * },
   * "labware3" : {
   *   "expected_type" : "waste_tube",
   *   "display_remove" : false,
   *   "display_barcode" : false
   * }
   *};
   */

  //TODO: check this declaration is ok
  var RowModel = Object.create(Object.prototype);

  $.extend(RowModel, {
    init:function (owner) {
      this.owner = owner;
      this.labwares = {};
      this.remove_arrow = false;
      return this;
    },
    setupModel:function (inputModel) {
      this.rowNum   = inputModel.rowNum;
      this.remove_arrow = inputModel.remove_arrow;
      this.labwares = inputModel;
      delete this.labwares.rowNum;
      delete this.labwares.remove_arrow;
    },
    setResource:function (value) {
      this.resource = value
    }
  });

  var RowPresenter = Object.create(BasePresenter);

  // interface ....
//  var tp = function (owner, presenterFactory) {
//    this.owner = owner;
//    this.currentView = undefined;
//    this.presenterFactory = presenterFactory;
//    
//    this.rowNum = undefined;
//    return this;
//  };


  $.extend(RowPresenter, {
    register: function(callback) {
      callback('row_presenter', function(owner, factory) {
        return Object.create(RowPresenter).init(owner, factory);
      });
    },

    init:function (owner, presenterFactory) {
      this.presenterFactory = presenterFactory;
      this.owner = owner;
      return this;
    },
    setupPresenter:function (input_model, jquerySelection) {
      this.setupPlaceholder(jquerySelection);

      this.rowModel = Object.create(RowModel).init(this);
      if (input_model) {
        this.rowModel.setupModel(input_model);
      }
      this.rowNum = input_model.rowNum;
      this.setupView();
      this.setupSubPresenters();
      this.renderView();

      if (input_model.remove_arrow) {
        this.currentView.removeArrow();
      }

      return this;
    },

    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    setupView:function () {
      this.currentView = new View(this, this.jquerySelection);
      return this;
    },

    setupSubPresenters:function () {
      var that = this;
      this.presenters = _.chain(this.rowModel.labwares).pairs().map(function(nameToDetails) {
        var name = nameToDetails[0], details = nameToDetails[1];
        var presenter = that.presenterFactory.create('labware_presenter', that);
        presenter.setupPresenter(details, function() { return that.jquerySelection().find('.' + name); });
        return presenter;
      });
      return this;
    },

    setupSubModel:function () {
      return this;
    },

    renderView:function () {
      this.currentView.renderView();
      this.presenters.each(function(p) { p.renderView(); }).value();
      return this;
    },

    release:function () {
      this.jquerySelection().release();
      return this;
    },

    setLabwareVisibility:function () {
      // Each labware presenter is only enabled if it's previous is complete and it is not complete
      this.presenters.reduce(function(memo, presenter) {
        if (!memo) {
          presenter.labwareEnabled(false);
          return false
        }

        var complete = presenter.isComplete();
        presenter.labwareEnabled(!complete);
        return complete;
      }, true).value();
    },

    childDone:function (child, action, data) {
      var data = $.extend(data, { origin: child });

      if (action == "tube rendered") {
        this.owner.childDone(this, "tubeFinished", data);
      } else if (action == "barcodeScanned") {
        this.owner.childDone(this, "barcodeScanned", data);
        if (this.isRowComplete() && (child === this.editablePresenters().last().value())) {
          this.owner.childDone(this, "completed", data);
        }
      } else if (action == "labwareRendered") {
        this.setLabwareVisibility();
      }
    },

    editablePresenters: function() {
      return this.presenters.compact().filter(function(p) { return !p.isSpecial(); });
    },
    isRowComplete: function() {
      return this.editablePresenters().all(function(p) { return p.isComplete(); }).value();
    },

    handleResources: function(callback) {
      callback.apply(null, this.editablePresenters().map(function(p) { return p.labwareModel.resource; }).value());
    }
  });

  return RowPresenter;

});
