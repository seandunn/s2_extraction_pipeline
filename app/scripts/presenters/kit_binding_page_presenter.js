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
       'extraction_pipeline/views/kit_binding_page_view',
       'extraction_pipeline/models/kit_binding_model'
], function (ConnectedPresenter, View, Model) {
  "use strict";

  var Presenter = ConnectedPresenter.extend('kit_presenter', Model, View);

  $.extend(Presenter, {
    setupSubModel:function () {
      this.setValidState();
      return this;
    },

    renderView:function () {
      // render view...
      this.currentView.renderView();

      if (this.barcodePresenter) {
        this.barcodePresenter.renderView();
      }

      return this;
    },

    setValidState:function () {
      var kitType = this.jquerySelection().find('.kitSelect').val();
      var valid = this.model.validateKitTubes(kitType);
      this.currentView.setKitValidState(valid);

      return valid;
    },
  });

  return Presenter;
});
