define([], function () {
    "use strict";

    function login_click(owner) {
        return function () {
            if (owner) {
                var userbarcode = $("#user_barcode").val();
                var tube_barcode = $("#tube_barcode").val();

                owner.login(userbarcode, tube_barcode);
            }
        }
    }


    var loginview = function (owner, container) {
        this.owner = owner;
        this.container = $(container);
    };

    loginview.prototype.release = function() {
        this.container.empty();
    };

    loginview.prototype.update = function (data) {

        var contentAsString = "<div>"
            + "<div class='span3'>Enter your barcode. Now.<div><input id='user_barcode' value='123'></div></div>"
            + "<div class='span3'>And the tube barcode!<div><input id='tube_barcode' value='456'></div></div>"
            + "<button id='login_button'>Let\'s go</button>";

        if (data) {
            contentAsString += "<div class='alert'>"
                + "<button type='button' class='close' data-dismiss='alert'>&times;</button>"
                + "<strong>Error!</strong> " + data.error
                + "</div>";
        }
        contentAsString += "</div>";

        this.container.empty().append( contentAsString );

        $("#login_button").click(login_click(this.owner));
    };

    return loginview;
});
