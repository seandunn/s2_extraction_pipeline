define(['text!extraction_pipeline/html_partials/default_page_partial.html'], function (defaultPagePartialHtml) {
  "use strict";

  function onLogin_clicked(owner, view) {
    /*
     * response to the click on the login button...
     * tells the owner that we want to try a login
     */
    return function () {
      if (owner) {
        var userbarcode = $(".user_barcode input").val();
        var tube_barcode = $(".labware_barcode input").val();

        owner.childDone(view, "login", { userBC:userbarcode, labwareBC:tube_barcode });
      }
    }
  }

  function onReturnKey_pressed(owner) {
    /*
     * response to a return key pressed.
     * NB: hacked for now, as it tell reuses the onLogin_clicked method()...
     */
    return function (e) {
      // TODO : change the onLogin_clicked() to a callback passed as an argument.
      var code = (e.keyCode ? e.keyCode : e.which);
      if (code == 13) {
        onLogin_clicked(owner)();
      }
    };
  }

  var loginview = function (owner, jquerySelection) {
    // constructor
    this.owner = owner;
    this.jquerySelection = jquerySelection;
  };

  loginview.prototype.release = function () {
    return this.jquerySelection().empty();
  };

  loginview.prototype.renderView = function (errorText) {

    _.templateSettings.variable = 'underscoreResource';

    // set the data as template data
    var templateData = {
      errorText:errorText
    };

    // makes sure that the container has been emptied first...
    this.release().append(_.template(defaultPagePartialHtml)(templateData));

    // adds the js response to the ui elements
    // $("#tube_barcode").bind('keypress', onReturnKey_pressed(this.owner));
    $("#login_button").click(onLogin_clicked(this.owner, this));
  };

  return loginview;
});
