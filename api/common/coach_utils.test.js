(function () {
    'use strict';
    /*jshint expr: true*/

    describe('CoachDB utils', function () {

        var should = require('should');

        var container = require('../container.js');
        var CoachUtils = require('./coach_utils.js');

        var plugins = container.get('plugins');
        var config = container.get('config');

        var logMock = {
            debug: function () {}
        };

        var pluginsMock = {
            q: plugins.q,
            moment: plugins.moment,
            request: plugins.request
        };

        var configMock = {
            db: {
                server: config.db.server,
                name: "db_test"
            }
        };

        var coachUtils = new CoachUtils(logMock, pluginsMock, configMock);

        it('should be defined', function () {
            coachUtils.should.be.ok;
        });

        describe('Sting key query parameter', function () {

            it('should be empty if there is no parameter', function () {
                var key = coachUtils.addKey();
                key.should.be.equal('');
            });

            it('should be a string key, if there is one parameter', function () {
                var key = coachUtils.addKey('parameter');
                key.should.be.equal('?key="parameter"');
            });

            it('should be a string startkey and endkey, if there are two items in the parameter array', function () {
                var key = coachUtils.addKey(['parameter1', 'parameter2']);
                key.should.be.equal('?startkey="parameter1"&endkey="parameter2"');
            });
        });

        describe('Data key query parameter', function () {

            it('should be empty if there is no parameter', function () {
                var key = coachUtils.addDateKey();
                key.should.be.equal('');
            });

            it('should be an integer key of a unix epoch timestamp, if there is one parameter', function () {
                var key = coachUtils.addDateKey('2014-12-12');
                key.should.be.equal('?key=1418338800');
            });

            it('should be a integer startkey and endkey of unix epoch timestamps, if there are two items in the parameter array', function () {
                var key = coachUtils.addDateKey(['2014-12-12', '2015-12-12']);
                key.should.be.equal('?startkey=1418338800&endkey=1449874800');
            });
        });
    });
})();