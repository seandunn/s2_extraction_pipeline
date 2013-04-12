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
       'extraction_pipeline/presenters/connected_presenter',
       'extraction_pipeline/views/byproduct_transfer_page_view',
       'extraction_pipeline/models/byproduct_transfer_model'
], function (ConnectedPresenter, View, Model) {
  "use strict";

  var Presenter = ConnectedPresenter.extend('byproduct_transfer_presenter', Model, View);

  $.extend(Presenter, {
    renderView:function () {
      // render view...
      this.currentView.renderView();
      if (this.barcodePresenter) {
        this.barcodePresenter.renderView();
      }
      return this;
    },

    currentViewDone: function(child, action, data) {
      if (action === "next") {
        this.owner.childDone(this, "done", { batch:this.model.batch });
      } else if (action == 'printOutputTubeBC') {
        this.model.createOutputs();
        this.currentView.setPrintButtonEnabled(false);
      }
    },

    rowDone: function(child, action, data) {
      if (action === 'completed') {
        var model = this.model;
        child.handleResources(function() { model.makeAllTransfers.apply(model, arguments); });
      }
    },
  });

  return Presenter;
})
;
