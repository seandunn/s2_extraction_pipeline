//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013,2014 Genome Research Ltd.
define(["text!app-components/imager/_button.html"], function(buttonTemplate) {
  "use strict";
  
  return function(context) {
    var instance = {
      view: $(_.template(buttonTemplate, context)),
      events: {
        "onClicked": _.identity
      },
      enable: function() {
        this.view.attr("disabled", false);
      },
      disable: function() {
        this.view.attr("disabled", true);
      }      
    };
    
    instance.view.on("click", _.bind(function(e) {
      e.preventDefault();
      instance.events.onClicked();
    }, instance));
    
    return instance;
  };
});
