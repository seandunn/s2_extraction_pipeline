define([], function () {
  "use strict";

  function onLogin_clicked(that, owner) {
    /*
    * response to the click on the login button...
    * tells the owner that we want to try a login
    */
    return function () {
      if (owner) {
        var data = {
          userbarcode : $("#user_barcode").val(),
          tube_barcode : $("#tube_barcode").val()
        };

        owner.childDone(that, "enteredLoginDetails", data);
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

  loginview.prototype.renderView = function (data) {
    console.log("renderView : ", data);
    var contentAsString = "<div>"
        + "<div><p>Enter your barcode. Now.</p><div><input id='user_barcode' value='123'></div></div>"
        + "<div ><p>And the tube barcode!</p><div><input id='tube_barcode' value='456'></div></div>"
        + "<div align='right'><button id='login_button'>Let\'s go</button></div>";

    if (data && data.error) {
      contentAsString += "<div class='alert'>"
          + "<button type='button' class='close' data-dismiss='alert'>&times;</button>"
          + "<strong>Error!</strong> " + data.error.msg;
          + "</div>";
    }
    contentAsString += "</div>";

    // makes sure that the container has been emptied first...
    this.release().append(contentAsString);

    // adds the js response to the ui elements
    this.jquerySelection().find("#tube_barcode").bind('keypress', onReturnKey_pressed(this.owner));
    this.jquerySelection().find("#login_button").click(onLogin_clicked(this,this.owner));
  };

  return loginview;
});
