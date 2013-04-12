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

      // TODO: check whether anything else required
      return this;
    },
    setupModel:function (inputModel) {
      var that = this;
      _.chain(inputModel).pairs().each(function(nameToDetails) {
        that[nameToDetails[0]] = nameToDetails[1];
      });
    },
    setResource:function (value) {
      this.resource = value
    },
    getTubeType:function () {
      // use the resource to get the aliquot type
      if (this.resource) {
        return this.resource.aliquots.type;
      }
      return;
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

      this.labware1Presenter = undefined;
      this.labware2Presenter = undefined;
      this.labware3Presenter = undefined;

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
      if (!this.labware1Presenter && this.rowModel.hasOwnProperty('labware1')) {
        this.labware1Presenter = this.presenterFactory.create('labware_presenter', this);
      }
      if (!this.labware2Presenter && this.rowModel.hasOwnProperty('labware2')) {
        this.labware2Presenter = this.presenterFactory.create('labware_presenter', this);
      }
      if (!this.labware3Presenter && this.rowModel.hasOwnProperty('labware3')) {
        this.labware3Presenter = this.presenterFactory.create('labware_presenter', this);
      }

      // TODO: for now, the tube is always the same... no use of the mapper

      this.setupSubModel();

      return this;
    },
    setupSubModel:function () {
      var that = this;

      var jquerySelectionForLabware1 = function () {
        return that.jquerySelection().find('.labware1')
      };

      var jquerySelectionForLabware2 = function () {
        return that.jquerySelection().find('.labware2')
      };

      var jquerySelectionForLabware3 = function () {
        return that.jquerySelection().find('.labware3')
      };

      if (this.labware1Presenter) {
        this.labware1Presenter.setupPresenter(this.rowModel.labware1, jquerySelectionForLabware1);
      }
      if (this.labware2Presenter) {
        this.labware2Presenter.setupPresenter(this.rowModel.labware2, jquerySelectionForLabware2);
      }
      if (this.labware3Presenter) {
        this.labware3Presenter.setupPresenter(this.rowModel.labware3, jquerySelectionForLabware3);
      }
      return this;
    },
    renderView:function () {
      // render view...
      this.currentView.renderView();
      if (this.labware1Presenter)
        this.labware1Presenter.renderView();
      if (this.labware2Presenter) {
        this.labware2Presenter.renderView();
      }
      if (this.labware3Presenter)
        this.labware3Presenter.renderView();
      return this;
    },
    release:function () {
      this.jquerySelection().release();
      return this;
    },

    setLabwareVisibility:function () {
      var labware1Enabled = true;
      var labware2Enabled = true;
      var labware3Enabled = true;

      if (this.labware2Presenter) {
        if (this.labware2Presenter.isComplete() &&
          this.labware1Presenter.isComplete() &&
          this.labware1Presenter.labwareModel.display_barcode) {
          labware1Enabled = false;
        }
        if (!this.labware2Presenter.isComplete() && !this.labware1Presenter.isComplete()) {
          labware2Enabled = false;
        }
        this.labware2Presenter.labwareEnabled(labware2Enabled);
        this.labware1Presenter.labwareEnabled(labware1Enabled);
      }
      if (this.labware2Presenter && this.labware3Presenter) {
        if (!this.labware3Presenter.isComplete() && !this.labware2Presenter.isComplete()) {
          labware3Enabled = false;
        }
        this.labware3Presenter.labwareEnabled(labware3Enabled);
      }

    },

    childDone:function (child, action, data) {
      var data = $.extend(data, { origin: child });

      if (action == "tube rendered") {
        this.owner.childDone(this, "tubeFinished", data);
      } else if (action == "barcodeScanned") {
        this.owner.childDone(this, "barcodeScanned", data);
        if (this.isRowComplete() && (child === this.presenters().last().value())) {
          this.owner.childDone(this, "completed", data);
        }
      } else if (action == "labwareRendered") {
        this.setLabwareVisibility();
      }
    },

    presenters: function() {
      return _.chain([ this.labware1Presenter, this.labware2Presenter, this.labware3Presenter ]).compact();
    },
    isRowComplete: function() {
      return this.presenters().all(function(p) { return p.isComplete(); }).value();
    },

    handleResources: function(callback) {
      callback.apply(null, this.presenters().map(function(p) { return p.labwareModel.resource; }).value());
    }
  });

  return RowPresenter;

});
