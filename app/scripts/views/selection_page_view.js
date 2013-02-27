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
    this.jquerySelector = selection;
    return this;
};

  SelectionPageView.prototype.render = function (model) {
    /* Renders the current view from the given model
     *
     * Arguments
     * ---------
     * model : the model to render

     */
    var selection = this.jquerySelector(),
    i,
    pageParts,
    table;

    parts = [ '<div id="truc">',
	      '<p>user barcode : ', model.user, '</p>',
	      '<p>batch uuid : ', model.batch !== undefined ? model.batch : 'new', '</p>',
	      '</div>'
	    ];


    
    console.log(model);

    table = this.renderTable(model); 
    parts.push(table);

    parts.push('<div align="right">');
    parts.push('<button>next</button>');
    parts.push('</div>');
    var html = parts.join('');
    console.log('page html', html);

    selection.empty().append(html);
    
    this.attachEvents();
  };

  SelectionPageView.prototype.renderTable = function (model) {
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
    var data = [], 
    i,
    tableParts,
    tableHtml;
    for (i = 0; i < model.getNumberOfTubes(); i++) {
      data[i] = model.getTubeUuidFromTubeIndex(i);
    }
    data[i++] = "pending";
    for (; i < model.getCapacity(); i++) {
      data[i] = "empty_" + i;
    }

    tableParts = data.map(function(id) { return '<tr id="' + id + '"><td><p>' + id + '</p></td></tr>'; });
    tableHtml = '<table><tbody>' + tableParts.join('') + '</tbody></table>';
    console.log('table html: ', tableHtml);
    return tableHtml;
  };

  SelectionPageView.prototype.attachEvents = function() {
    /* Renders the next button
     */

    var button = this.jquerySelector().find("div button"),
    owner = this.owner;
    button.on("click", function () {
      owner.childDone(owner, "next", undefined);
    });
  };

  SelectionPageView.prototype.clear = function () {
    /* Clears the current view from the screen.
     */
    this.jquerySelector().empty();
  };

  return SelectionPageView;

});
