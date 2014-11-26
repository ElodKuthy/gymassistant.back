(function () {
    'use strict';
    /*jshint expr: true*/

    describe('Configuration', function () {

        var should = require('should');
        var config = require('./config.js');

        it('should be defined', function() {
            config.should.be.ok;
        });

        describe('Log section', function() {

            var log = config.log;

            it('should be defined', function() {
                log.should.be.ok;
            });

            it('should include console setting', function () {
                log.console.should.be.ok;
            });

            it('should include logFile setting', function () {
                log.logFile.should.be.ok;
            });

            it('should include exceptions setting', function () {
                log.exceptions.should.be.ok;
            });

            it('should include level setting', function () {
                log.level.should.be.ok;
            });
        });

        describe('DB section', function() {

            var db = config.db;

            it('should be defined', function() {
                db.should.be.ok;
            });

            it('should include server setting', function () {
                db.server.should.be.ok;
            });

            it('should include name setting', function () {
                db.name.should.be.ok;
            });
        });
    });
})();