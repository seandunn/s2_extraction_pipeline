define([
  'text!extraction_pipeline/extra_components/busy_box_partial.html'
],
    function (partialHtml) {
      "use strict";

      return {
        init:function(){
          var body = $('body');
          body.on('s2.busybox.process_event', this.processEventHandler);
          body.on('s2.busybox.start_process', this.startProcessEventHandler);
          body.on('s2.busybox.end_process', this.endProcessEventHandler);
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
          var parent = target.parent();
          if (parent.hasClass('busyClass')) {
            $(document.body).css('cursor', 'default');
            parent.replaceWith(target.detach());
          }
        },
        startProcessEventHandler:function (event) {
          var target = $(event.target);
          var parent = target.parent();
          if (!parent.hasClass('busyClass')) {
            $(document.body).css('cursor', 'progress');
            var h = target.height();
            var w = target.width();
            var html = _.template(partialHtml);
            var busy = target.after(html).next();
            busy.find('.busyBox').css('width', w + "px");
            busy.find('.busyBox').css('top', (h/2 - 30) + "px");

            var detachedTarget = target.detach();
            busy.append(detachedTarget);
          }
        }
      }

    });