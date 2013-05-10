define([ 'extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/models/selection_page_model'
  , 'text!extraction_pipeline/html_partials/selection_page_partial.html'
], function(BasePresenter, Model, selectionPagePartialHtml) {
  'use strict';

  var PagePresenter = Object.create(BasePresenter);

  $.extend(PagePresenter, {
    register:function (callback) {
      callback('selection_page_presenter', function (owner, factory, initData) {
        return Object.create(PagePresenter).init(owner, factory, initData);
      });
    },

    init:function (owner, presenterFactory, initData) {
      this.presenterFactory = presenterFactory;
      this.model = Object.create(Model).init(this, initData);
      this.owner = owner;
      return this;
    },
    setupPresenter:function (setupData, jquerySelection) {
      this.jquerySelection = jquerySelection;

      if (setupData.batch) {
        this.model.setBatch(setupData.batch); // the batch BEFORE the labware!
      } else if (setupData.labware) {
         this.model.setSeminalLabware(setupData.labware);
      } else throw "This page should not be show without either batch or scanned labware";

      this.model.setUser(setupData.user);

      // this.view = new View(this, this.jquerySelection);
      this.setupSubPresenters();
      this.renderView();
      return this;
    },

    renderView:function () {

      //marshalling data for the view
      var dataForView = {
        batch:this.model.batch && this.model.batch.uuid,
        user:this.model.user,
        capacity:this.model.getCapacity(),
        processTitle:this.model.config.processTitle
      };

      // start of view code
        var that = this;

        //create a list for underscore to iterate through in partial html
        var indices = new Array();

        for (var i = 1; i <= dataForView.capacity; i++) { indices.push(i); }

        var template = _.template(selectionPagePartialHtml);

        // set the user and indices as template data
        var templateData = {
          user:dataForView.user,
          indices:indices,
          processTitle:dataForView.processTitle
        };


        this.jquerySelection().empty().append(template(templateData));

        this.jquerySelection().on("click", "button.btn", function () {
          that.childDone(that, "next");
        });
        // end of view code

      // render subviews...
      _.each(this.presenters, function (presenter) {
        presenter.renderView();
      });

      this.presenters[this.model.getNumberOfTubes()].barcodeFocus();
      return this;
    },
    setupSubPresenters:function () {
      var that = this;
      this.presenters = [];
      _(this.model.getCapacity()).times(function () {
        var subPresenter = that.presenterFactory.create('labware_presenter', that);
        that.presenters.push(subPresenter);
      });

      this.setupSubModel();
      return this;
    },

    setupSubModel:function () {
      var presenter = this;
      var jQueryForNthChild = function (childIndex) {
        return function () {
          return presenter.jquerySelection().find("li :eq(" + childIndex + ")");
        };
      };

      if (!this.model) {
        return;
      }

      var numTubes = this.model.getNumberOfTubes()
      var presenterData = [];

      _.each(this.model.tubes, function (tube) {
        presenterData.push({
          resource:tube,
          expected_type:presenter.model.config.input.model.singularize(),
          display_remove:true,
          display_barcode:false
        });
      });

      presenterData.push({
        expected_type:presenter.model.config.input.model.singularize(),
        display_remove:false,
        display_barcode:true,
        display_labware:false
      });

      // numTubes + 1 to account for the intermediate barcode scan row
      _(this.model.getCapacity() - (numTubes + 1)).times(function () {
        presenterData.push({
          display_remove:false,
          display_barcode:false,
          display_labware:false
        });
      });

      _.chain(this.presenters).zip(presenterData).each(function (pair, index) {
        var presenter = pair[0], config = pair[1];
        presenter.setupPresenter(config, jQueryForNthChild(index));
      }).value();
    },

    displayBarcodeError:function (message) {
      //numTubes is the index number of the barcode input view in the array of presenters
      var numTubes = this.model.getNumberOfTubes();
      this.presenters[numTubes].displayErrorMessage(message);
    },

    release:function () {
      this.jquerySelection().empty();
      return this;
    },

    childDone:function (child, action, data) {
      /* Handles done messages from the page view and child presenters.
       *
       * Any messages that happen to come from the PageView will be delegated over to
       * selfDone.
       *
       * Arguments
       * ---------
       * child : the presenter(or model) instance the done message is coming from. Can be
       *             either the PagePresenter, one of the PartialPresenters or the model
       * action:     a string representing the action request, e.g. 'next' for someone
       *             clicking on the next button
       * data:       Any data associated with the action.
       *
       */
        if (action === "next") {
          this.model.makeBatch();
        }
      if (child === this.model) {
        if (action === "modelUpdated") {
          // TODO: use the data provided by the model to only update the relevant subpresenters...
          this.setupSubPresenters();
          this.renderView();


        } else if (action === "batchSaved") {
          var dataForOwner = {
            user:this.model.user,
            labware:this.model.labware,
            batch:this.model.batch
          };
          this.owner.childDone(this, "done", dataForOwner);
        } else if (action === "barcodeNotFound") {
          this.displayBarcodeError("Barcode not found");
        }
      } else {
        if (action === "barcodeScanned") {
          this.model.addTubeFromBarcode(data.BC);
        } else if (action === "removeLabware") {
          this.model.removeTubeByUuid(data.resource.uuid);
        }
      }
    }
  });

  return PagePresenter;
});
