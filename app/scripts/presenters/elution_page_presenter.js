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


define(['extraction_pipeline/views/elution_page_view',
  'extraction_pipeline/presenters/base_presenter',
  'extraction_pipeline/models/elution_model'
], function (View, BasePresenter, ElutionModel) {

  var ElutionLoadingPresenter = Object.create(BasePresenter);

  $.extend(ElutionLoadingPresenter, {
    register: function(callback) {
      callback('elution_presenter', function(owner, factory, initData) {
        return Object.create(ElutionLoadingPresenter).init(owner, factory, initData);
      });
    },

    /* Initialises the presenter and defines the view to be used
     *
     *
     * Arguments
     * ---------
     * input_model:     The input model containing the current pipeline state
     *
     * jquerySelection: The selector method for the HTML container this presenter is responsible for
     *
     *
     * Returns
     * -------
     * this
     */
    // interface ....
    init:function (owner, presenterFactory, initData) {
      this.owner = owner;
      this.elutionModel = Object.create(ElutionModel).init(this, initData);
      this.currentView = undefined;
      this.rowPresenters = [];
      this.presenterFactory = presenterFactory;
      return this;
    },

    setupPresenter:function (input_model, jquerySelection) {
      this.setupPlaceholder(jquerySelection);
      this.elutionModel.setBatch(input_model.batch);
      this.setupView();
      this.renderView();
      this.setupSubPresenters();

      return this;
    },

    /* Sets the container selector method for the presenter
     *
     *
     * Arguments
     * ---------
     * jquerySelection: The selector method for the presenter
     *
     *
     * Returns
     * -------
     * this
     */
    setupPlaceholder:function (jquerySelection) {
      this.jquerySelection = jquerySelection;
      return this;
    },

    /* Sets up the presenters view
     *
     *
     * Arguments
     * ---------
     *
     *
     * Returns
     * -------
     * this
     */
    setupView:function () {
      this.currentView = new View(this, this.jquerySelection);
      return this;
    },

    /* Sets up any subpresenters to be displayed in this instance
     *
     *
     * Arguments
     * ---------
     *
     *
     * Returns
     * -------
     * this
     */
    setupSubPresenters:function () {
      var that = this;
      this.elutionModel.tubes.then(function(tubes){
        that.rowPresenters = _.chain(tubes).map(function(){
          return that.presenterFactory.create('row_presenter', that);
        }).value();
      });
      this.setupSubModel();
      return this;
    },

    /* Delegates the models for the subpresenters
     *
     *
     * Arguments
     * ---------
     *
     *
     * Returns
     * -------
     * this
     */
    setupSubModel:function () {

      var that = this;
      var jquerySelectionForBarcode = function () {
        return that.jquerySelection().find('.barcode')
      };

      this.elutionModel.tubes.then(function(tubes) {
        for (var rowIndex = 0; rowIndex < tubes.length; rowIndex++) {
          var rowModel = that.elutionModel.getRowModel(row);
          that.rowPresenters[row].setupPresenter(rowModel, function () {
            return that.jquerySelection().find('.row' + row);
          });
        }
      });
      return this;
    },

    /* Renders the current view and its internal placeholders
     *
     *
     * Arguments
     * ---------
     *
     *
     * Returns
     * -------
     * this
     */
    renderView:function () {
      // render view...
      this.currentView.renderView();
      return this;
    },

    /* Checks if all of the pages tasks have been completed before moving forward in the pipeline
     *
     *
     * Arguments
     * ---------
     *
     *
     * Returns
     * -------
     * this
     */
    checkPageComplete:function () {
      var complete = true;
      for (var i = 0; i < this.rowPresenters.length; i++) {
        if (!this.rowPresenters[i].isRowComplete()) {
          complete = false;
          break;
        }
      }

      //TODO: Add check that tube barcodes have been printed

      return complete;
    },

    /* Clears the current view and all of its children
     *
     *
     * Arguments
     * ---------
     *
     *
     * Returns
     * -------
     * this
     */
    release:function () {
      this.currentView.clear();
      return this;
    },

    /* Indicates a child has completed an action
     *
     *
     * Arguments
     * ---------
     * child:     The child that has completed
     * action:    The action completed
     * data:      Supplementary data to the completed action
     *
     *
     * Returns
     * -------
     * this
     */
    childDone:function (child, action, data) {

      if (action === 'elutionStarted') {
        if (this.elutionModel.checkPageComplete()) {
          this.elutionModel.startModel();
          this.owner.childDone(this, 'elutionStarted', {});
        }
      } else if (action === 'printOutputTubeBC') {
        this.elutionModel.printBarcodes([]);
        this.currentView.setPrintButtonEnabled(false);
        this.owner.childDone(this, 'error', {message:'Output tube barcodes printed'});
      }
    }
  });

  return ElutionLoadingPresenter;
})
;
