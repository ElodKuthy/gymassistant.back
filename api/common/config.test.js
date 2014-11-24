(function () {
    "use strict";
    /*jshint expr: true*/

    var should = require("should");
    var proxyquire = require("proxyquire");
    var a = require("a");


    describe("Config", function () {

        var expected = { log: {} };

        var mockFileRead = a.mock();
        mockFileRead.expect(__dirname + "./../../config.json").return(expected);

        var config = proxyquire("./config", { "jsonfile": { readFileSync : mockFileRead } });

        it("should read the config file", function () {
            mockFileRead.verify().should.be.ok;
        });

        describe("Log", function() {

            it("should return the config log", function () {
                var log = config.log;
                log.should.be.equal(expected.log);
            });
        });
    });
})();