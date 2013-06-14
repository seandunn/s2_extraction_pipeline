define(['extraction_pipeline/presenters/base_presenter'
  , 'extraction_pipeline/models/summary_page_model'
  , 'text!extraction_pipeline/html_partials/summary_page_partial.html'
  , 'extraction_pipeline/lib/pubsub'
], function (BasePresenter, Model, summaryPagePartialHtml, PubSub) {

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
      var template = _.template(summaryPagePartialHtml)

      var templateData = {};
      templateData.config = thisPresenter.config;

      thisPresenter.model
        .then(function (model) {
          return model.ordersByUUID;
        })
        .fail(function(error){
          thisPresenter.message('error', 'Labware not found for this batch');
//          PubSub.publish('s2.summary_page.')
        })
        .then(function(orders){
          templateData.orders = orders;
          thisPresenter.jquerySelection().html(template(templateData));
        });

      return this;
    },
    message: function (type, message) {
      if (!type) {
        this.jquerySelection()
          .find('.validationText')
          .hide();
      } else {
        this.jquerySelection()
          .find('.validationText')
          .show()
          .removeClass('alert-error alert-info alert-success')
          .addClass('alert-' + type)
          .html(message);
      }
    }
  });

  return SummaryPagePresenter;
});
