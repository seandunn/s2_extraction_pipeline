define(['config'
  , 'extraction_pipeline/presenters/base_presenter'
  , 'text!extraction_pipeline/html_partials/volume_control_partial.html'
  , 'extraction_pipeline/models/volume_control_model'
  , 'extraction_pipeline/lib/pubsub'
], function (config, BasePresenter, volumeControlPartialHtml, Model, PubSub) {
  'use strict';

//  var userCallback = function(event, template, presenter){
//    presenter.model.user = event.currentTarget.value;
//
//    template.find('.alert-error').addClass('hide');
//    template.find("input").attr('disabled', true);
//
//    presenter.jquerySelectionForRack().
//        find("input").
//        removeAttr('disabled').
//        focus();
//  };

//  var barcodeErrorCallback = function(errorText){
//    var errorHtml = function(errorText){
//      return $("<h4/>", {class: "alert-heading", text: errorText});
//    };
//
//    return function(event, template, presenter){
//      template.
//          find('.alert-error').
//          html(errorHtml(errorText)).
//          removeClass('hide');
//
//      template.
//          find('input').
//          removeAttr('disabled');
//    };
//  };

//  var labwareCallback = function(event, template, presenter){
//    template.find("input").attr('disabled', true);
//    template.find('.alert-error').addClass('hide');
//
//    var login = function(model){
//      if (model.labware){
//        presenter.owner.childDone(presenter, "login", model);
//      } else {
//        barcodeErrorCallback("Labware not found on system.")(undefined, template);
//      }
//    };
//
//    presenter.model
//        .setLabwareFromBarcode(event.currentTarget.value)
//        .then(login, login);  // Hack!  Login whether or not we find a batch...
//    // Should be moved to SelectionPresenter.
//  };

  var VolumeControlPresenter = Object.create(BasePresenter);

  $.extend(VolumeControlPresenter, {
    register: function (callback) {
      callback('volume_control_presenter', function (owner, factory, initData) {
        return Object.create(VolumeControlPresenter).init(owner, factory, initData);
      });
    },

    init: function (owner, factory, config) {
      this.owner = owner;
      this.config = config;
      this.presenterFactory = factory;
      this.model = Object.create(Model).init(this, config);
      return this;
    },

    initialPresenter: function () {
      // Does nothing, for the moment!
      //this.owner.childDone(this, 'disableBtn', this.config);
    },

    focus: function () {
      // this.barcodePresenter.focus();
    },

    setupPresenter: function (setupData, jquerySelection) {
      var thisPresenter = this;
      thisPresenter.jquerySelection = jquerySelection;

      thisPresenter.model
          .then(function (model) {
            return model.setupModel(setupData);
          })
          .then(function () {
            thisPresenter.jquerySelectionForRack = function () {
              return jquerySelection().find('.dropzone .labware');
            };
            thisPresenter.jquerySelectionForControlTube = function () {
              return jquerySelection().find('.control .labware');
            };
            thisPresenter.rackPresenter = thisPresenter.presenterFactory.create('labware_presenter', thisPresenter);
            thisPresenter.controlPresenter = thisPresenter.presenterFactory.create('labware_presenter', thisPresenter);

            thisPresenter.rackPresenter.setupPresenter({
              "expected_type":   "rack",
              "display_labware": true,
              "display_remove":  false,
              "display_barcode": false
            }, thisPresenter.jquerySelectionForRack);

            thisPresenter.controlPresenter.setupPresenter({
              "expected_type":   "tube",
              "display_labware": true,
              "display_remove":  true,
              "display_barcode": true
            }, thisPresenter.jquerySelectionForControlTube);

            PubSub.subscribe("s2.labware.barcode_scanned", eventHandler(thisPresenter,thisPresenter.barcodeScanned));
            PubSub.subscribe("s2.labware.file_dropped", eventHandler(thisPresenter,thisPresenter.fileDropped));

            thisPresenter.renderView();
          });

      return this;
    },

    fileDropped: function (event, source, eventData){

    },

    barcodeScanned: function (event, source, eventData) {
      var d= $.Deferred();
      var b = this.model
          .fail(failureCallback("coudln't get the model"))
          .then(function (model) {
            return model.setControlSourceFromBarcode(eventData.BC);
          })
          .fail(failureCallback("coudln't set the source control "))
          .then(function(){
            console.log("success2");
          })
          .fail(failureCallback("error2 "))
          .then(function(){
            console.log("success3");
          })
          .fail(failureCallback("error3"))

    },

    renderView: function () {
      this.jquerySelection().html(_.template(volumeControlPartialHtml)({}));
      var rackLabwareView = this.rackPresenter.renderView();
      var controlLabwareView = this.controlPresenter.renderView();

      //var errorCallback = barcodeErrorCallback('Barcode must be a 13 digit number.');
      //var barcodeCallback = function () {};

      //this.bindReturnKey(this.jquerySelectionForControlTube(), barcodeCallback, errorCallback );
//      this.jquerySelectionForRack().append(this.bindReturnKey( this.labwareBCSubPresenter.renderView(), labwareCallback, errorCallback));

      return this;
    },

    childDone: function (child, action, data) {
    },

    release: function () {
    }

  });

  var barcodeErrorCallback = function (errorText) {
    var errorHtml = function (errorText) {
      return $("<h4/>", {class: "alert-heading", text: errorText});
    };

    return function (event, template, presenter) {
      template.
          find('.alert-error').
          html(errorHtml(errorText)).
          removeClass('hide');

      template.
          find('input').
          removeAttr('disabled');
    };
  };

  function failureCallback(msg) {
    return function(error){
      console.error(msg);
      return { "error":msg, previousError:error };
    }
  }

  function eventHandler(context,callback){
    return function (event, source, eventData) {
      context.callback(event,source,eventData)    }

  }

  return VolumeControlPresenter;
});

