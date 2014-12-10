(function () {
    'use strict';
    /*jshint expr: true*/

    describe('Configuration', function () {

        var expect = require('chai').expect;
        var container = require('../container.js');
        var config = container.get('config');

        it('should be defined', function() {
            expect(config).to.exist;
        });

        describe('Log section', function() {

            var log = config.log;

            it('should be defined', function() {
                expect(log).to.exist;
            });

            it('should include console setting', function () {
                expect(log).to.have.property('console');
            });

            it('should include logFile setting', function () {
                expect(log).to.have.property('logFile');
            });

            it('should include exceptions setting', function () {
                expect(log).to.have.property('exceptions');
            });

            it('should include level setting', function () {
                expect(log).to.have.property('level');
            });
        });

        describe('DB section', function() {

            var db = config.db;

            it('should be defined', function() {
                expect(db).to.exist;
            });

            it('should include server setting', function () {
                expect(db).to.have.property('server');
            });

            it('should include name setting', function () {
                expect(db).to.have.property('name');
            });
        });
    });
})();