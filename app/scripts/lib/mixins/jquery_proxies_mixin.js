define([], function() {

  function JqueryProxies($el) {
    return {
      enable: $.proxy($el, "attr", "disabled", false),
      disable: $.proxy($el, "attr", "disabled", true),
      on: $.proxy($el, "on"),
      off: $.proxy($el, "off")
    }
  }

  return JqueryProxies;
});