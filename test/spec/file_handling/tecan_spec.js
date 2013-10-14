define(['lib/file_handling/tecan'], function(tecanHandler) {
  'use strict';

  return function() {      
    describe("Tecan Files", function(){
      var tecanData;
      var tecanFile;
            
      beforeEach(function(done){
          var files= {
          };
          $.when.apply(this, _.map(['../test/data/gwl/127073.gwl', '../test/data/gwl/127073.json'], function(path) {
              return $.ajax(path, {success: _.partial(function(url, data) {
                  files[url]=data;
              }, path)}).promise();
          })).then(function() {
              tecanFile = files['../test/data/gwl/127073.gwl'];
              tecanData = files['../test/data/gwl/127073.json'];
              done();
          }).fail(function() {
              console.log('error executing');
          });
      });

      it("can parse a Tecan File", function(){
        var tecanParsing = tecanHandler.parse(tecanData, 13);
        var result = tecanParsing.match(tecanFile);
        expect(result !==null).to.equal(true);
      });

    });

  };
});
