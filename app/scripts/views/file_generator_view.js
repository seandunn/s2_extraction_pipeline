define([
  'text!html_partials/_file_generator.html'
], function(partial) {
  'use strict';

  var View = function(owner, selector) {
    this.owner    = owner;
    this.selector = selector;
    this.template = _.template(partial);
    return this;
  };

  _.extend(View.prototype, {
    renderView: function(model) {
      var trigger = _.bind(this.owner.triggerDownload, this.owner);

      this.selector()
          .html(this.template(model))
          .find(".generate")
          .on('click', function() { trigger(); return false; })
          .removeAttr('disabled');
    },

    // Details on how this function behaves, in creating a URL and attaching it to the anchor in the view, can be found
    // here: http://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
    downloadFile: function(data, options) {
      options = options || {};

      var mime =
        (options.mime || "application/octet-stream") +
          _.chain(options)
           .omit(["mime","filename"])
           .reduce(function(memo, key, value) { return memo + ";" + value + "=" + key; }, "")
           .value();

      var filename =
        options.filename || "download-file";

      var encoded =
        encodeURIComponent(data);

      this.selector()
          .find(".download")
          .attr("href", "data:" + mime + "," + encoded)
          .attr("download", filename)
          .show();
    }
  });

  return View;
});
