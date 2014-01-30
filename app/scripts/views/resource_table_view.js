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