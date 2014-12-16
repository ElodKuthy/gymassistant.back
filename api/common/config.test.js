(function () {
    'use strict';
    /*jshint expr: true*/

    describe('Configuration', function () {

        var container = require('../container.js')('config.json');
        var expect = container.get('plugins').expect;
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

        describe('Server section', function() {

            var server = config.server;

            it('should be defined', function() {
                expect(server).to.exist;
            });

            it('should include server setting', function () {
                expect(server).to.have.property('port');
            });
        });

        describe('Email section', function() {

            var email = config.email;

            it('should be defined', function() {
                expect(email).to.exist;
            });

            it('should include from setting', function () {
                expect(email).to.have.property('from');
            });

            it('should include host setting', function () {
                expect(email).to.have.property('host');
            });

            it('should include secureConnection setting', function () {
                expect(email).to.have.property('secureConnection');
            });

            it('should include port setting', function () {
                expect(email).to.have.property('port');
            });

            it('should include transportMethod setting', function () {
                expect(email).to.have.property('transportMethod');
            });

            it('should include auth setting', function () {
                expect(email).to.have.property('auth');
                expect(email.auth).to.have.property('user');
                expect(email.auth).to.have.property('pass');
            });

        });
    });
})();