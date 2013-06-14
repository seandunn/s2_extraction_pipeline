define(['extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/models/summary_page_model'
  , 'text!extraction_pipeline/html_partials/summary_page_partial.html'
], function (BasePresenter, Model, summaryPagePartialHtml) {

  var SummaryPagePresenter = Object.create(BasePresenter);

  $.extend(SummaryPagePresenter, {
    register: function (callback) {
      callback('summary_page_presenter', function (owner, factory, initData) {
        return Object.create(SummaryPagePresenter).init(owner, factory, initData);
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.presenterFactory = factory;
      this.model = Object.create(Model).init(this, config);
      return this;
    },

    setupPresenter: function (setupData, jquerySelection) {
      var thisPresenter = this;
      thisPresenter.jquerySelection = jquerySelection;

      thisPresenter.model
        .then(function (model) {
          return model.setupModel(setupData);
        })
        .then(function () {
          thisPresenter.renderView();
        });
      return this;
    },

    renderView: function () {
      var thisPresenter = this;
      thisPresenter.jquerySelection().html(_.template(summaryPagePartialHtml)({}));

      thisPresenter.model
        .then(function (model) {
          // TODO: use the model to get summary info about the batch
        });

      return this;
    }
  });

  return SummaryPagePresenter;
});
