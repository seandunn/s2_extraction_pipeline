define([], function () {

  var SelectionPageView = function (owner, selection) {
    /* Constructor for SelectionPageView
     *
     * Arguments
     * ---------
     * owner :    the presenter that owns this class. Expected to be an
     *            instance of SelectionPagePresenter
     * selection: A jquery selection. This is converted to be a d3 selection
     *            for rendering. 
     */
    this.owner = owner;
    this.selection = d3.selectAll(selection);
    this.table = undefined;
    this.pageDetailsDiv = undefined;
    return this;
};

  SelectionPageView.prototype.render = function (model) {
    /* Renders the current view from the given model
     *
     * Arguments
     * ---------
     * model : the model to render

     */
    this.pageDetailsDiv = this.selection.append("div");
    this.pageDetailsDiv.attr("id", "truc");
    this.pageDetailsDiv.append("p").text("user barcode :" + model.user);
    this.pageDetailsDiv.append("p").text("batch uuid :" + model.batch);
    console.log(model);
    this.table = this.selection.append("table");
    this.rows = this.renderRows(model);
    this.buttonDiv = this.renderButton();
  };

  SelectionPageView.prototype.renderRows = function (model) {
    /* Renders the base table rows
     *
     * Returns
     * -------
     * The d3 selection elements corresponding to each order
     * in the given model.
     *
     * Arguments
     * ---------
     * model : the model to render
     */
    var data = [];
    var i;
    for (i = 0; i < model.getNumberOfOrders(); i++) {
      data[i] = model.getOrderUuidFromOrderIndex(i);
    }
    data[i++] = "pending";
    for (; i < model.getCapacity(); i++) {
      data[i] = "empty_" + i;
    }
    var enter = this.table.selectAll().data(data).enter();
     enter.append("tr").attr("id", String).append("td").text(String);

    this.rows = this.table.selectAll("tr");
    return this.rows;
  };

  SelectionPageView.prototype.renderButton = function() {
    /* Renders the next button
     */

    var div = this.selection.append("div");
    div.attr("align", "right");
    var button = div.append("button");
    var owner = this.owner;
    button.text("next");
    button.attr("align", "right");
    button.on("click", function () {
      owner.childDone(owner, "next", undefined);
    });

    return div;
  };

  SelectionPageView.prototype.clear = function () {
    /* Clears the current view from the screen.
     */
    if (this.pageDetailsDiv) {
      this.pageDetailsDiv.remove();
    }
    if (this.table != undefined) {
      this.table.remove();
    }
    if (this.buttonDiv != undefined) {
      this.buttonDiv.remove();
    }
    this.table = undefined;
    this.rows = undefined;
    this.buttonDiv = undefined;
  };

  SelectionPageView.prototype.getRowByIndex = function(index) {
    return this.rows.filter(function(d, i) { return i === index; });
    }

  return SelectionPageView;

});
