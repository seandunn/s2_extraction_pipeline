//This file is part of S2 and is distributed under the terms of GNU General Public License version 1 or later;
//Please refer to the LICENSE and README files for information on licensing and authorship of this file.
//Copyright (C) 2014 Genome Research Ltd.
define([
  "text!html_partials/_resource_table.html"
], function(partial) {

  var ResourceTableView = function(args) {
    var options         = args["resourceTable"];
    
    this.rowInformation = options["rowInformation"];
    this.template       = _.template(partial);

    return this;
  }

  ResourceTableView.prototype.render = function() {
    return this.template({
      rows: this.rowInformation
    });
  };

  return ResourceTableView;
});
