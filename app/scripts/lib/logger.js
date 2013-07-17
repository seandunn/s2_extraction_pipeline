define(['config'], function (config) {
  'use strict';

  var Logger = Object.create(null);
  var loggingKey = "message_";
  var maxNbOfMessages = 1000;

  var loggerConfig = {
    DEBUG:   { level: 0, prefix: "DEBUG   -  ", withFeedback: false },
    WARNING: { level: 1, prefix: "WARNING -  ", withFeedback: false },
    ERROR:   { level: 2, prefix: "ERROR   -  ", withFeedback: true  },
    NONE:    { level: 4, prefix: "XXXXXXXXXXX", withFeedback: false }
  };

  function supports_html5_storage() {
    try {
      return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
      return false;
    }
  }

  // removes old data from localStorage
  function flush() {
    localStorage.nextMessageIndex = 0;
    for (var i = 0; i < maxNbOfMessages; i++) {
      delete localStorage[loggingKey + i];
    }
  }

  // formats the date in a useful way
  function formatDate(date) {
    var curr_day = date.getDate();
    var curr_month = date.getMonth() + 1; //Months are zero based
    var curr_year = date.getFullYear();
    var curr_hour = date.getHours();
    var curr_min = date.getMinutes();
    var curr_s = date.getSeconds();
    var curr_ms = date.getMilliseconds();
    return [curr_day, "/", curr_month, "/", curr_year, "@", curr_hour, ":", curr_min , ":", curr_s, curr_ms].join('');
  }

  $.extend(Logger, {
    init: function () {
      $('body').append('<div id="logger-window"><div class="title">Debug window</div><pre class="content prettyprint"></pre></div>');
      // first we check that we can use the localstorage...
      if (!Logger.canLogLocally) {
        console.warn("WARNING: this browser does not support local storage. It is not possible to log any information.");
      } else {
        // we cleanup the previous session
        flush();
        // we add the error handler
        window.onerror = function (msg, url, lineNumber) {
          Logger.error({message: msg, details: {url: url, lineNumber: lineNumber}});
        };
        // we patch the ajax call
        if (loggerConfig[config.verboseLevel] && loggerConfig[config.verboseLevel].level <= loggerConfig["NONE"].level) {
          this.decorateAjaxCall(config);
        }
      }
    },

    decorateAjaxCall: function (configInstance) {
      var originalMethod = configInstance.ajax;
      configInstance.ajax = function (options) {
        var newOptions = $.extend({}, options, {
          beforeSend: function () {
            Logger.debug({message: "AJAX request: ", details: options});
          }
        });
        return originalMethod(newOptions)
            .then(function (result) {
              Logger.debug({message: "AJAX response (success) :", details: result});
              return result;
            })
            .fail(function (error) {
              Logger.error({message: "AJAX response (error) :", details: error});
              throw "AJAX response (error)!"
            })
      }
    },

    error: function (logDetails) {
      this.logMessage("ERROR", logDetails);
    },

    warn: function (logDetails) {
      this.logMessage("WARNING", logDetails);
    },

    debug: function (logDetails) {
      this.logMessage("DEBUG", logDetails);
    },

    logMessage: function (eventLevel, logDetails) {
      if (loggerConfig[config.verboseLevel] && loggerConfig[config.verboseLevel].level <= loggerConfig[eventLevel].level) {
        if (localStorage.nextMessageIndex >= maxNbOfMessages) {
          localStorage.nextMessageIndex = 0; // override existing log details by resetting the current pointer
        }
        var next_message_key = loggingKey + localStorage.nextMessageIndex;
        localStorage.nextMessageIndex++;
        $.extend(logDetails, {eventLevel: eventLevel, time: formatDate(new Date())});
        localStorage[next_message_key] = (JSON.stringify(logDetails));

        if (loggerConfig[eventLevel].withFeedback) {
          this.emailAdministratorCallback();
        }
      }
    },

    // returns a 'human' readable version of the log entries
    dump: function () {
      var logEntries = [];
      for (var i = 0; i < maxNbOfMessages; i++) {
        var shiftedKey = (i + parseInt(localStorage.nextMessageIndex)) % maxNbOfMessages;
        if (localStorage[loggingKey + shiftedKey]) {
          logEntries.push(JSON.parse(localStorage[loggingKey + shiftedKey]));
        }
      }
      var user = this.user;
      return _.map(logEntries,function (logEntry) {
        var time = logEntry.time;
        var prefix = loggerConfig[logEntry.eventLevel].prefix;
        delete logEntry.eventLevel;
        delete logEntry.time;
        return prefix + time + " - " + user + " :\n" + JSON.stringify(logEntry, null, 4);
      }).reverse().join('\n'); // Note the reverse(), to get the entries backward
    },

    emailAdministratorCallback: function () {
      var data = this.dump();
      if (config.withLoggingWindow){
        $('#logger-window').show().find('.content').html(data);
      }
      var msg = "An error occured during the execution of " +
          "the S2 Extraction Client.\n\nThis email has been " +
          "auto-generated to provide debugging information " +
          "to the S2 adminstrators.\n\nPlease send this email " +
          "as soon as possible to report the error.\n\n\n" + data;
      window.location.href = "mailto:psd-help@sanger.ac.uk?"
          + "subject=" + encodeURIComponent("S2 Extraction Client Error Log - " + this.user)
          + "&body=" + encodeURIComponent(msg);
    },

    user: "unknown",

    canLogLocally: supports_html5_storage() // only evaluated once!
  });

  return Logger;
});
