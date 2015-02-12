//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2013 Genome Research Ltd.
define([
       'text!html_partials/_kit.html'
], function(partial) {
  var View = function(owner, selector) {
    this.owner    = owner;
    this.selector = selector;
    this.template = _.template(partial);
    return this;
  };

  _.extend(View.prototype, {
    renderView: function(model) {
      var html = this.template(model);
      var component = this;

      this.selector().
        html(html).
        on('keypress','input', function(event) {
        if (event.which === 13) {
          component.owner.childDone(component.owner, 'barcodeScanned', event.currentTarget.value);
        }
      });
    },

    message: function(type, message) {
      this.selector().find('.validationText').
        removeClass('alert-error alert-info alert-success').
        addClass('alert-' + type).
        text(message);
    },

  });

  return View;

});

