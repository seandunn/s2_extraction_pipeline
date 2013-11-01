define([
  "text!extra_components/_busy_box.html",
  "spinjs"
],
function (partialHtml, Spinner) {
  "use strict";


  var opts = {
    lines: 17, // The number of lines to draw
    length: 15, // The length of each line
    width: 17, // The line thickness
    radius: 10, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: "#bbf", // #rgb or #rrggbb
    speed: 2, // Rounds per second
    trail: 53, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: true, // Whether to use hardware acceleration
    className: "spinner", // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: "auto", // Top position relative to parent in px
    left: "auto" // Left
  };

  var busyBox = Object.create(null);

  $.extend(busyBox, {
    init:function(){
      var body = $("body");
      body.on("process_in_progress.busybox.s2", this.processEventHandler);
      body.on("start_process.busybox.s2", this.startProcessEventHandler);
      body.on("end_process.busybox.s2", this.endProcessEventHandler);
    },
    processEventHandler:function (event, inProgress) {
      if (inProgress) {
        this.startProcessEventHandler(event);
      } else {
        this.endProcessEventHandler(event);
      }
    },
    endProcessEventHandler:function (event) {
      var target = $(event.target);
      var parent = target.parent().parent();
      if (parent.hasClass("busyClass")) {
        $(document.body).css("cursor", "default");
        parent.replaceWith(target.detach());
      }
    },
    startProcessEventHandler:function (event) {
      var target = $(event.target);
      var parent = target.parent().parent();
      if (!parent.hasClass("busyClass")) {
        $(document.body).css("cursor", "progress");
        var h = target.height();
        var w = target.width();
        var html = _.template(partialHtml);
        var busy = target.after(html).next();
        parent.find(".busyClass").css("width", w + "px");
        busy.find(".busyBox").css("left", (w/2 - 150) + "px");
        busy.find(".busyBox").css("top", (h/2 - 40) + "px");


        busy.find(".busyBoxMask")
        .css("width", w + "px")
        .css("height", (h) + "px")
        .click(function(event){
          event.preventDefault();
          event.stopPropagation();
        });
        var detachedTarget = target.detach();
        busy.find(".innerElement").append(detachedTarget);
        var spinner = new Spinner(opts);
        spinner.spin(busy.find(".busySpin").get(0));
      }
    }
  });

  return busyBox;

});
