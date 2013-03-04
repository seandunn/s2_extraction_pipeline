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


define(['extraction_pipeline/views/kit_view'], function (View) {
// TODO: remove me !!!!

  // interface ....
  var tp = function (owner, presenterFactory) {
    this.owner = owner;
    this.currentView = undefined;
    return this;
  };


  tp.prototype.setupPresenter = function (input_model, jquerySelection) {
//    console.log("et  : setupPresenter");
    this.jquerySelection = jquerySelection;

    return this;
  };

  tp.prototype.setupPlaceholder = function(jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
  };

  tp.prototype.setupView = function() {
      this.currentView = new View(this, this.jquerySelection);
      return this;
  };

  tp.prototype.updateModel = function(model) {
      this.model = model;
      this.setupSubPresenters();
      return this;
  }

  tp.prototype.setupSubPresenters = function() {
      return this;
  }

  tp.prototype.renderView = function () {
    // render view...
//    console.log("et  : presenter::renderView, ", this.jquerySelection());
    this.jquerySelection().empty().append("empty");

    return this;
  };


  tp.prototype.release = function () {
    this.jquerySelection().release();
    return this;
  };


  return tp;
});
