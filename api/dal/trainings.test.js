(function () {
    'use strict';
    /*jshint expr: true*/

    describe('Trainings data access layer', function () {

        var expect = require('chai').expect;
        var a = require('a');

        var container = require('../container.js')('test_config.json');
        var Trainings = require('./trainings.js');

        var plugins = container.get('plugins');
        var config = container.get('config');
        config.db.name = 'test_trainings_db';

        var logMock = {
            debug: function (message) { console.log('debug: ' + message); },
            error: function (message) { console.log('error: ' + message); },
            info: function (message) { console.log('info: ' + message); }
        };

        var coachUtils = new (require('../common/coach_utils.js'))(logMock, plugins, config);

        it('should be defined', function () {
            var coachUtilsMock = a.mock();
            var errorsMock = a.mock();

            var trainings = new Trainings(plugins, coachUtils, logMock, errorsMock);

            expect(trainings).to.exist;
        });

        beforeEach('Set up test db', function (done) {
            coachUtils.createDb().then(function () { done(); }, function () { done(); });
        });

        afterEach('Tear down test db', function (done) {
            coachUtils.deleteDb().then(function () { done(); }, function () { done(); });
        });

        describe('update status', function () {

            var id = 'test_id';
            var oldStatus = 'normal';
            var status = 'canceled';

            beforeEach('Create test training', function (done) {
                coachUtils.request('PUT', id, { status: oldStatus }).then(function () { done(); }, done);
            });

            it('should update the status of the proper training', function (done) {
                var errorsMock = a.mock();

                var trainings = new Trainings(plugins, coachUtils, logMock, errorsMock);

                trainings.updateStatus(id, status).then(statusUpdated, error);

                function statusUpdated(result) {
                    try {
                        expect(result).to.have.property('ok', true);
                        coachUtils.request('GET', id).then(checkUpdatedTraining, error);
                    } catch (err) {
                        error(err);
                    }
                }

                function checkUpdatedTraining(training) {
                    try {
                        expect(training).to.have.property('status', status);
                        done();
                    } catch (err) {
                        error(err);
                    }
                }

                function error(err) {
                    done(err);
                }
            });

            it('should return error, if no training with that id', function (done) {
                var invalid_id = 'foo';
                var errorsMock = a.mock();

                var trainings = new Trainings(plugins, coachUtils, logMock, errorsMock);

                trainings.updateStatus(invalid_id, status).then(statusUpdated, expectedError);

                function statusUpdated() {
                    error(new Error('That should not be happened'));
                }

                function expectedError(err) {
                    try {
                        var errParsed = JSON.parse(err.message);
                        expect(errParsed).to.have.property('error', 'not_found');
                        expect(errParsed).to.have.property('reason', 'missing');
                        done();
                    } catch (unexpectedError) {
                        error(unexpectedError);
                    }
                }

                function error(err) {
                    done(err);
                }
            });
        });
    });
})();