define(['config'
  , 'controllers/base_controller'
  , 'text!html_partials/_manifest_reader.html'
  , 'text!html_partials/_sample_row.html'
  , 'models/manifest_reader_model'
  , 'lib/pubsub'
  , 'views/drop_zone'
], function (config, BaseController, componentPartialHtml, sampleRowPartial, Model, PubSub, DropZone) {
  'use strict';

  var template = _.template(sampleRowPartial);

  // TODO: move this into underscore templates
  function templateHelper(callback) {
    return function(cell) {
      var value   = cell.value || cell.default;
      var element = callback(cell, value);
      return element.addClass(cell.class)
                    .attr("data-name_of_column", cell.columnName);
    };
  }

  // Functions that generate will display a particular value based on the type it should be.
  var CellTemplates = {
    select: templateHelper(function(cell, value) {
      return $("<select/>").append(_.map(cell.options, option));

      function option(option) {
        var details = {value: option.trim(), text: option.trim()};
        if (details.value.toUpperCase() === value.trim().toUpperCase()) {
          details["selected"] = "selected";
        }
        return $("<option></option>", details);
      }
    }),

    checkbox: templateHelper(function(cell, value) {
      var checkbox = $("<input type='checkbox' />");
      if (value) { checkbox.attr('checked', 'checked'); }
      return checkbox;
    }),

    span: templateHelper(function(cell, value) {
      return $("<span />").text(value);
    })
  };

  // Functions that, given an element in the order view, will extract the value based on the type it should be.
  var Extractors = {
    checkbox: function(element) { return element.find("input:checkbox:first").is(":checked"); },
    select:   function(element) { return element.find("select:first").val(); },
    span:     function(element) { return element.find("span:first").text(); }
  };


  var Controller = Object.create(BaseController);

  $.extend(Controller, {
    register: function (callback) {
      callback('manifest_reader_controller', function () {
        var instance = Object.create(Controller);
        Controller.init.apply(instance, arguments);
        return instance;
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.factory = factory;
      this.config = config;
      this.model = Object.create(Model).init(this, config);
      this.view = this.createHtml();
      this.subscribeToPubSubEvents();
      return this;
    },

    createHtml: function () {
      var html = $(_.template(componentPartialHtml)());
      // saves the selection for performances
      this.registerBtnSelection = html.find('#registrationBtn').hide();
      this.orderMakerSelection = html.find(".orderMaker");

      this.dropzone = DropZone.init(html.find('.dropzone'));
      this.dropzone.enable(_.bind(dropZoneLoad, this));

      html.delegate("#registrationBtn:not(:disabled)", "click", _.bind(createOrder, this));
      return html;
    },

    subscribeToPubSubEvents: function () {
      var thisController = this;
      PubSub.subscribe("s2.reception.reset_view", resetViewEventHandler);
      function resetViewEventHandler(event, source, eventData) {
        thisController.reset();
      }
    },

    reset: function () {
      this.model.reset();
      this.dropzone.show();
      this.registerBtnSelection.hide();
      this.orderMakerSelection.empty();
      this.message();
    },

    // message box

    message: function (type, message) {
      if (!type) {
        this.view
            .find('.validationText')
            .hide();
      } else {
        this.view
            .find('.validationText')
            .show()
            .removeClass('alert-error alert-info alert-success')
            .addClass('alert-' + type)
            .html(message);
      }
    }
  });

  return Controller;

  // Functions handling the toggling of rows.
  function nearestRow(event) {
    return $(event.target).closest("tr");
  }
  function disableRow(tr) {
    tr.find("select,input").attr("disabled", true);
    tr.removeClass("success");
    return tr;
  }
  function enableRow(tr) {
    tr.find("select,input").attr("disabled", false);
    tr.addClass("success");
    return tr;
  }
  function enableRowSelector(tr) {
    tr.find("input[data-name_of_column='_SELECTED']").attr("disabled",false);
  }

  // Functions handling the generation of view components.
  function normalView(content) {
    return CellTemplates[content.type || 'span'](content);
  }
  function errorView(element) {
    $(element, "select,input").attr("disabled", true);
    return element;
  }
  function elementToHtml(element) {
    return element.wrap("<div/>").parent().html();
  }

  // Some utility functions for dealing with processes
  function displayManifest(controller, manifest) {
    controller.registerBtnSelection.show();

    createSamplesView(
      controller.orderMakerSelection,
      manifest
    );

    return manifest;
  }
  function startProcess(controller, value) {
    controller.message();
    controller.view.trigger("s2.busybox.start_process");
    return value;
  }
  function finishProcess(controller, value) {
    controller.view.trigger("s2.busybox.end_process");
    return value;
  }

  // View related functions
  function updateDisplay(transform, details) {
    details.display = transform(details.row);
    return details;
  }
  function generateView(details) {
    var viewCreators = [normalView];
    if (details.errors.length > 0) viewCreators.unshift(errorView);
    viewCreators.unshift(elementToHtml);
    details.views = _.map(details.display, _.compose.apply(undefined, viewCreators));
    return details;
  }

  function createSamplesView(view, manifest) {
    // Generate the display and then render the view
    _.each(manifest.tubes, _.compose(generateView, _.partial(updateDisplay, manifest.template.json_template_display)));
    view.append(template({
      headers:  _.map(manifest.tubes[0].display, function(c) { return c.friendlyName || c.columnName; }),
      manifest: manifest
    }));

    // Deal with checking & unchecking rows for orders
    view.delegate(
      "input[data-name_of_column='_SELECTED']:checked",
      "click",
      _.compose(enableRowSelector, enableRow, nearestRow)
    ).delegate(
    "input[data-name_of_column='_SELECTED']:not(:checked)",
    "click",
    _.compose(enableRowSelector, disableRow, nearestRow)
    );

    view.show();
  }

  function resetView(controller) {
    controller.orderMakerSelection.empty();
    controller.view.find("#registrationBtn").hide();
  }

  function dropZoneLoad(fileContent) {
    var deferred = $.Deferred().resolve(this.model);
    var loadFile = function() { return this.model.setFileContent(fileContent); }

    // Remove the previous results
    deferred.then(_.partial(startProcess, this))
            .then(_.partial(resetView, this))
            .then(_.bind(this.dropzone.hide, this.dropzone))
            .then(_.bind(loadFile, this))
            .always(_.partial(displayManifest, this))
            .then(_.partial(success, this, deferred), _.partial(failure, this, deferred))
            .fail(_.bind(this.dropzone.show, this.dropzone))
            .always(_.partial(finishProcess, this))
    return deferred.promise();

    function failure(controller, deferred, value) {
      controller.message('error', 'There are errors with the manifest. Fix these or proceed with caution!');
      controller.view.find("#registrationBtn").addClass("btn-warning");
      deferred.reject();
      return value;
    }
    function success(controller, deferred, value) {
      deferred.resolve(controller);
      controller.view.find("#registrationBtn").removeClass("btn-warning");
      return value;
    }
  }

  function disableButton(button) {
    button.prop('disabled', true).hide();
  }
  function enableButton(button) {
    buffer.prop('disabled', false).show();
  }

  function createOrder() {
    var controller = this;

    $.Deferred()
     .resolve(this.model)
     .always(_.partial(disableButton, this.registerBtnSelection), _.bind(this.dropzone.hide, this.dropzone))
     .always(_.partial(startProcess, this))
     .then(_.partial(buildDataFromGUI, this))
     .then(_.bind(this.model.updateSamples, this.model))
     .then(_.partial(success, this), _.partial(failure, this))
     .fail(_.partial(enableButton, this.registerBtnSelection), _.bind(this.dropzone.show, this.dropzone))
     .always(_.partial(finishProcess, this));
    return;

    function failure(controller, error) {
      controller.message('error', 'Something went wrong during sample update: ' + error.message);
      return error;
    }
    function success(controller, value) {
      controller.message('success', 'Samples successfully updated.');
      return value;
    }
  }

  function buildDataFromGUI(controller) {
    var extractors =
      _.chain(controller.model.manifest.tubes[0].display)
       .pluck('type')
       .map(buildExtractor)
       .value();

    return controller.orderMakerSelection
                     .find("tbody tr.success")
                     .map(function() {
                       return _.chain(extractors)
                               .zip($(this).find("td"))
                               .map(function(p) { return p[0](p[1]); })
                               .compact()
                               .object()
                               .value();
                     });
  }
  function buildExtractor(type) {
    var extractor = Extractors[type || 'span'];

    return function(element) {
      element = $(element);

      var data = element.find(":first").data();
      if (_.isUndefined(data)) return undefined;
      return [data.name_of_column, extractor(element)];
    };
  }
});

