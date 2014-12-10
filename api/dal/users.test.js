(function () {
    'use strict';
    /*jshint expr: true*/

    describe('Users data access layer', function () {

        var expect = require('chai').expect;
        var a = require('a');

        var container = require('../container.js');
        var Users = require('./users.js');

        var plugins = container.get('plugins');
        var config = container.get('config');
        config.db.name = 'test_users_db';

        var logMock = {
            debug: function (message) { console.log('debug: ' + message); },
            error: function (message) { console.log('error: ' + message); },
            info: function (message) { console.log('info: ' + message); }
        };

        var coachUtils = new (require('../common/coach_utils.js'))(logMock, plugins, config);

        it('should be defined', function () {
            var coachUtilsMock = a.mock();
            var errorsMock = a.mock();

            var users = new Users(plugins, coachUtils, logMock, errorsMock);

            expect(users).to.exist;
        });

        beforeEach('Set up test db', function (done) {
            coachUtils.createDb().then(function () { done(); }, function () { done(); });
        });

        afterEach('Tear down test db', function (done) {
            coachUtils.deleteDb().then(function () { done(); }, function () { done(); });
        });

        describe('update email', function () {

            var id = 'test_id';
            var oldEmail = 'oldName@mail.com';
            var email = 'testUser@mail.com';

            beforeEach('Create test user', function (done) {
                coachUtils.request('PUT', id, { email: oldEmail }).then(function () { done(); }, done);
            });

            it('should update the email of the proper user', function (done) {
                var errorsMock = a.mock();

                var users = new Users(plugins, coachUtils, logMock, errorsMock);

                users.updateEmail(id, email).then(emailUpdated, error);

                function emailUpdated(result) {
                    try {
                        expect(result).to.have.property('ok', true);
                        coachUtils.request('GET', id).then(checkUpdatedUser, error);
                    } catch (err) {
                        error(err);
                    }
                }

                function checkUpdatedUser(user) {
                    try {
                        expect(user).to.have.property('email', email);
                        done();
                    } catch (err) {
                        error(err);
                    }
                }

                function error(err) {
                    done(err);
                }
            });

            it('should return error, if no user with that id ', function (done) {
                var invalid_id = 'foo';
                var errorsMock = a.mock();

                var users = new Users(plugins, coachUtils, logMock, errorsMock);

                users.updateEmail(invalid_id, email).then(emailUpdated, expectedError);

                function emailUpdated() {
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