//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define([ "config",  "event_emitter", "app-components/imager/imager", "models/selection_page_model" , "lib/pubsub", "mapper/operations", "text!app-components/imager/header.html", "app-components/imager/connect"
], function(appConfig, EventEmitter, imager, Model, PubSub, Operations, template, connect) {
  "use strict";
  return (
    { register : function(callback) {
      return callback("imager", imagerController);
    }
    });
  
  function imagerController(owner, factory, config) {
    var uuid = config.initialLabware.uuid;

    return $.extend({ 
      notBatched: true,
      getS2Root: _.constant(owner.rootPromise),
      beginImager: function() {
        var model = this.model;
        model.started = true;          
        PubSub.publish("message.status.s2", this, {message: 'Transfer started'});
        config.initialLabware.order().then(function(orderObj) {
          return {
            input: {
              order: orderObj,
              resource: config.initialLabware,
              role: config.input.role
            },
            output: {
              order: orderObj,
              resource: config.initialLabware,
              role: config.output[0].role                 
            }
          };
       }).then(function(data) {
         Operations.stateManagement().start({ updates: [data]});
       });          
      },
      endImager: function() {
        var model = this.model;
        PubSub.publish("message.status.s2", this, {message: 'Transfer completed'});
        config.initialLabware.order().then(function(orderObj) {
          return {
            input: {
              order: orderObj,
              resource: config.initialLabware,
              role: config.input.role
            },
            output: {
              order: orderObj,
              resource: config.initialLabware,
              role: config.output[0].role                 
            }
          };
       }).then(function(data) {
         return Operations.stateManagement().complete({ updates: [data]});
       });          
      },
      selectFile: function(data) {
        var file = this.dataParams.gel_image;
        // Encoding from: 
        // <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding>
        file.filename=data.name;
        file.image = data.content.substring(data.content.indexOf(",")+1);
        //file.image = window.btoa(unescape(encodeURIComponent(data.content)));
        //file.filename=data.
        //file.image = window.btoa("testing");
        
        //configButtons("done");            
      },
      upload: function() {
        var dataParams = this.dataParams, 
            model = this.model;
        // This must be moved to S2 Mapper
        var url = appConfig.apiUrl + "lims-quality";
        dataParams.gel_image.gel_uuid = uuid;
        var promiseQuery = $.ajax(url+"/gel_images",
          {
            headers :
            {
              Accept : "application/json; charset=utf-8",
              "Content-Type" : "application/json; charset=utf-8"
            }, 
            data : JSON.stringify(dataParams),
            method : "POST"
          }).then(_.bind(function() {
            this.view.trigger("success.status.s2",['Uploaded file']);
          }, this), _.bind(function() {
            this.view.trigger("error.status.s2", [arguments[2]]);
          }, this));
      },

      setupController : function(inputModel, selector) {
        this.config = config;
        this.owner = owner;
        var component = imager({labware: config.initialLabware});
        var view = this.view = selector();
        view.html(_.template(template, { config: config}));
        view.append(component.view);
        
        view.append($('<div><span class="filename"></span></div>'));
        //view.on(component.events);
        this.imagerView = component;
        
        // config buttons
        config.initialLabware.order().then(function(orderObj) {
          var role = config.output[0].role;
          var item = _.find(orderObj.items[role], function(node) {
            return node.uuid===config.initialLabware.uuid;
          });
          component.setStatus(item && item.status);
          //configButtons(item && item.status, component);
        });
        
        this.focus();
        
        this.model = Object.create(Model).init(this, config);
        this.model
        .then(function (model) {
          return model.setup(inputModel);
        });
        this.dataParams = {
        gel_image: {
          image: ""
        }
        };
        
        connect(this.imagerView.events, "onBegin", this, "beginImager");
        connect(this.imagerView.events, "onEnd", this, "endImager");
        connect(this.imagerView.events, "onSelectedFile", this, "selectFile");
        connect(this.imagerView.events, "onUploadedFile", this, "upload");
        
        return this;
      }, release : function() {},
      initialController: function(){
      },
      focus: function() {
        //this.imagerView.view.trigger("activate.s2");
      }
    }, new EventEmitter());
  }
});
