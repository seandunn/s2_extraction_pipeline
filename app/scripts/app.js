define(['workflow_engine','mapper/s2_ajax'], function(workflowEngine, S2Ajax) {
    var app = function () {
        this.workflow = new workflowEngine();
        this.current_page_presenter = {};
    };

    app.prototype.init = function () {
        this.current_page_presenter = this.workflow.get_default_presenter(this).init("#content").update();
    }

    app.prototype.child_done = function (page_presenter, action, data) {
        // for now, when a pagePresenter has done, we just load the same old page presenter...
        this.current_page_presenter.release();
        this.current_page_presenter = this.workflow.get_next_presenter(this).init("#tube1").update(data);
    }

    return app;
});