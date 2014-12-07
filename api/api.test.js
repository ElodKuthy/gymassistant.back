var request = require('nodeunit-express');
var should = require("should");
var app = require("../server.js");

describe("Routing", function () {
    describe("Default Route", function () {

        it("should return the title of the API", function() {
            var express = request(app);
            express.get('/api').expect(function (response) {
                response.statusCode.should.equal(200);
                response.body.should.equal({ message: "GymAssistant REST API" });
                    express.close();
                });
        });
    });
});
