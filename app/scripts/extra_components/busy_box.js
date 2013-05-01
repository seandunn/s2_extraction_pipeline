define([
  'text!extraction_pipeline/extra_components/busy_box_partial.html'
],
    function (partialHtml) {
      "use strict";

      return {
        init:function(){
          $("body").on('progressEvent', this.progressEventHandler);
        },
        progressEventHandler:function (event, inProgress) {
          var target = $(event.target);
          var parent = target.parent();
          if (!inProgress && parent.hasClass('busyClass')) {
            $(document.body).css('cursor', 'default');
            parent.replaceWith(target.detach());
          } else if (inProgress && !parent.hasClass('busyClass')) {
            $(document.body).css('cursor', 'progress');
            var h = target.height();
            var w = target.width();
            var html = _.template(partialHtml);
            var busy = target.after(html).next();
            busy.find('.busyBox').css('width', w + "px")
            busy.find('.busyBox').css('top', (h/2 - 30) + "px")

            var detachedTarget = target.detach();
            busy.append(detachedTarget);
          }
        }
      }

    });