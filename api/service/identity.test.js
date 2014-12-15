(function () {
    'use strict';
    /*jshint expr: true*/

    describe('Identity service', function () {

        var expect = require('chai').expect;
        var a = require('a');

        var container = require('../container.js')('test_config.json');
        var Identity = require('./identity.js');

        var plugins = container.get('plugins');
        var config = container.get('config');

        var logMock = {
            debug: function (message) { console.log('debug: ' + message); },
            error: function (message) { console.log('error: ' + message); },
            info: function (message) { console.log('info: ' + message); }
        };

        it('should be defined', function () {
            var usersMock = a.mock();
            var errorsMock = a.mock();
            var rolesMock = a.mock();

            var identity = new Identity(plugins, logMock, usersMock, errorsMock, rolesMock);

            expect(identity).to.exist;
        });

        describe('change email of user', function () {

            var id = 'test_id';
            var name = 'Test User';
            var oldEmail = 'oldName@mail.com';
            var email = 'testUser@mail.com';

            it('should change the email of the proper user', function (done) {
                var usersMock = {
                    byName: a.mock(),
                    updateEmail: a.mock()
                };
                var byNamePromiseMock = a.then();
                byNamePromiseMock.resolve([{ _id: id, name: name, email: oldEmail }]);
                usersMock.byName.expect(name).return(byNamePromiseMock);
                var updateEmailPromiseMock = a.then();
                updateEmailPromiseMock.resolve('success');
                usersMock.updateEmail.expect(id, email).return(updateEmailPromiseMock);
                var errorsMock = a.mock();
                var rolesMock = a.mock();

                var identity = new Identity(plugins, logMock, usersMock, errorsMock, rolesMock);

                identity.changeEmail(name, email).then(emailChanged, error);

                function emailChanged(result) {
                    try {
                        expect(usersMock.byName.verify()).to.be.true;
                        expect(usersMock.updateEmail.verify()).to.be.true;
                        expect(result).to.be.equal('Az email címet sikeresen megváltoztattuk');
                        done();
                    } catch (err) {
                        error(err);
                    }
                }

                function error(err) {
                    done(err);
                }
            });

            it('should return invalid email format error, if email format is invalid', function (done) {
                var invalidEmail = 'foo';
                var usersMock = a.mock();
                var errorsMock = {
                    invalidEmailFormat: a.mock()
                };
                errorsMock.invalidEmailFormat.expect().return(new Error('error'));
                var rolesMock = a.mock();

                var identity = new Identity(plugins, logMock, usersMock, errorsMock, rolesMock);

                identity.changeEmail(name, invalidEmail).then(emailChanged, expectedError);

                function emailChanged() {
                    error(new Error('That should not be happened'));
                }

                function expectedError(err) {
                    try {
                        expect(err).to.have.property('message', 'error');
                        done();
                    } catch (unexpectedError) {
                        error(unexpectedError);
                    }
                }

                function error(err) {
                    done(err);
                }
            });

            it('should return unknown user name error, if user not found', function (done) {
                var usersMock = {
                    byName: a.mock()
                };
                var byNamePromiseMock = a.then();
                byNamePromiseMock.resolve([]);
                usersMock.byName.expect(name).return(byNamePromiseMock);
                var errorsMock = {
                    unknownUserName: a.mock()
                };
                errorsMock.unknownUserName.expect().return(new Error('error'));
                var rolesMock = a.mock();

                var identity = new Identity(plugins, logMock, usersMock, errorsMock, rolesMock);

                identity.changeEmail(name, email).then(emailChanged, expectedError);

                function emailChanged() {
                    error(new Error('That should not be happened'));
                }

                function expectedError(err) {
                    try {
                        expect(err).to.have.property('message', 'error');
                        done();
                    } catch (unexpectedError) {
                        error(unexpectedError);
                    }
                }

                function error(err) {
                    done(err);
                }
            });

            it('should return error, if user findig failed', function (done) {
                var usersMock = {
                    byName: a.mock()
                };
                var byNamePromiseMock = a.then();
                byNamePromiseMock.reject(new Error('error'));
                usersMock.byName.expect(name).return(byNamePromiseMock);
                var errorsMock = a.mock();
                var rolesMock = a.mock();

                var identity = new Identity(plugins, logMock, usersMock, errorsMock, rolesMock);

                identity.changeEmail(name, email).then(emailChanged, expectedError);

                function emailChanged() {
                    error(new Error('That should not be happened'));
                }

                function expectedError(err) {
                    try {
                        expect(err).to.have.property('message', 'error');
                        done();
                    } catch (unexpectedError) {
                        error(unexpectedError);
                    }
                }

                function error(err) {
                    done(err);
                }
            });

            it('should return error, if update failed', function (done) {
                var usersMock = {
                    byName: a.mock(),
                    updateEmail: a.mock()
                };
                var byNamePromiseMock = a.then();
                usersMock.byName.expect(name).return(byNamePromiseMock.resolve([{ _id: id, name: name, email: oldEmail }]));
                var updateEmailPromiseMock = a.then();
                usersMock.updateEmail.expect(id, email).return(updateEmailPromiseMock.reject(new Error('error')));
                var errorsMock = a.mock();
                var rolesMock = a.mock();

                var identity = new Identity(plugins, logMock, usersMock, errorsMock, rolesMock);

                identity.changeEmail(name, email).then(emailChanged, expectedError);

                function emailChanged() {
                    error(new Error('That should not be happened'));
                }

                function expectedError(err) {
                    try {
                        expect(err).to.have.property('message', 'error');
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