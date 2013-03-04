define([], function () {
  "use strict";
  var that = this;
  function onLogin_clicked(owner) {
    /*
    * response to the click on the login button...
    * tells the owner that we want to try a login
    */
    return function () {
      if (owner) {
        var userbarcode = $(".user_barcode input").val();
        var tube_barcode = $(".labware_barcode input").val();

        owner.childDone(that , "login",{userBC:userbarcode, labwareBC:tube_barcode});
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
    var contentAsString = "<div>"
        + "<div><p>Enter your barcode. Now.</p>"
        + "<div class='user_barcode'>"

//        + "<div>"
        //+ "<input id='user_barcode' value='123' />"
        + "</div></div>"
        + "<div ><p>And the tube barcode!</p>"
        + "<div class='labware_barcode'>"
//        + "<div>"
//        + "<input id='tube_barcode' value='456'/>"
        + "</div></div>"
        + "<div align='right'><button id='login_button'>Let\'s go</button></div>";

    if (data) {
      contentAsString += "<div class='alert'>"
          + "<button type='button' class='close' data-dismiss='alert'>&times;</button>"
          + "<strong>Error!</strong> " + data
          + "</div>";
    }
    contentAsString += "</div>";

    // makes sure that the container has been emptied first...
    this.release().append(contentAsString);

    // adds the js response to the ui elements
//    $("#tube_barcode").bind('keypress', onReturnKey_pressed(this.owner));
    $("#login_button").click(onLogin_clicked(this.owner));
  };

  return loginview;
});
