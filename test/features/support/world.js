var webdriver = require('selenium-webdriver'),
    remote = require('selenium-webdriver/remote'),
    driver,
    server;

var World = function World(callback) {
    var self = this;

    server = new remote.SeleniumServer("./test/bin/selenium-server-standalone-2.34.0.jar", {});
    
    server.start().then(function() {
      
      self.driver = driver = new webdriver.Builder().
                        usingServer(server.address()).
                        withCapabilities({'browserName': 'phantomjs'}).
                        build();

      self.webdriver = webdriver;

      callback();
    });
};

// Close down the Selenium server and phantomJS driver when the process finishes
process.on('exit', function() {
  driver.quit();
  server.stop();
});

exports.World = World;