(function () {
    'use strict';
    /*jshint expr: true*/

    describe('Identity service', function () {

        var expect = require('chai').expect;

        var container = require('../container.js')('test_config.json');

        var plugins = container.get('plugins');
        var q = plugins.q;
        var coachUtils = container.get('coachUtils');
        var design = container.get('designDocumentsUpdater');
        var errors = container.get('errors');

        it('should be defined', function () {
            var identityService = container.get('identityService');

            expect(identityService).to.exist;
        });

        it('should create proper Base64 encoded SHA-512 hash', function () {
            var password = 'pwd123';
            var expectedHash = '8Z96jPtDdgOgPuEBRNKDadgqYIe56j6VkaxbxIzP2dCaw7CQbCVZmPwQnB+aFdDohkHEYgyNS8BngH0FebxKUw==';

            var identityService = container.get('identityService');

            var hash = identityService.createHash(password);

            expect(hash).to.equal(expectedHash);
        });

        describe('authentication', function () {

            var password = 'pwd123';

            var testUser = {
                _id: 'test_id',
                name: 'Test User',
                hash: '8Z96jPtDdgOgPuEBRNKDadgqYIe56j6VkaxbxIzP2dCaw7CQbCVZmPwQnB+aFdDohkHEYgyNS8BngH0FebxKUw==',
                email: 'test_user@gmail.com',
                roles: ['client'],
                type: 'user'
            };

            beforeEach('set up test db', function (done) {
                coachUtils.createDb()
                    .then(design.build)
                    .then(function () {
                        return q.all([
                            coachUtils.put(testUser._id, testUser),
                        ]);
                    })
                    .nodeify(done);
            });

            afterEach('tear down test db', function (done) {
                coachUtils.deleteDb().nodeify(done);
            });

            it('should parse proper basic authorization header', function () {
                var basicAuthorizationHeader = 'Basic dGVzdF91c2VyOnB3ZDEyMw==';
                var expectedUserName = 'test_user';
                var expectedPassword = 'pwd123';

                var identityService = container.get('identityService');

                var result = identityService.parseBasicAuthorizationHeader(basicAuthorizationHeader);

                expect(result).to.be.ok;
                expect(result).to.have.property('userName', expectedUserName);
                expect(result).to.have.property('password', expectedPassword);
            });

            it('should return invalid user or password error for invalid authorization header', function () {
                var basicAuthorizationHeader = 'Basic foo';

                var identityService = container.get('identityService');

                expect(function () { identityService.parseBasicAuthorizationHeader(basicAuthorizationHeader); })
                    .to.throw(errors.messages.invalidUserNameOrPassword);
            });

            it('should return user info, if proper user name and password was provided', function (done) {

                var identityService = container.get('identityService');

                var args = {
                    userName: testUser.name,
                    password: password
                };

                identityService.authenticate(args)
                    .then(function (user) {
                        expect(user).to.have.property('_id', testUser._id);
                        expect(user).to.have.property('name', testUser.name);
                        expect(user).to.have.property('email', testUser.email);
                        expect(user).to.have.property('roles');
                        expect(user.roles).to.have.length(1);
                        expect(user.roles[0]).to.equal('client');
                        expect(user).to.not.have.property('hash');
                        return user;
                    })
                    .nodeify(done);
            });
        });

        describe('change email of user', function () {

            var testUser = {
                _id: 'test_id',
                name: 'Test User',
                email: 'oldName@mail.com',
                type: 'user'
            };
            var otherTestUser = {
                _id: 'other_test_id',
                name: 'Other User',
                email: 'otherName@gmail.com',
                type: 'user'
            };
            var newEmail = 'testUser@mail.com';

            beforeEach('set up test db', function (done) {
                coachUtils.createDb()
                    .then(design.build)
                    .then(function () {
                        return q.all([
                            coachUtils.put(testUser._id, testUser),
                            coachUtils.put(otherTestUser._id, otherTestUser)
                        ]);
                    })
                    .nodeify(done);
            });

            afterEach('tear down test db', function (done) {
                coachUtils.deleteDb().nodeify(done);
            });

            it('should change the email of the proper user', function (done) {

                var identityService = container.get('identityService');

                identityService.changeEmail(testUser.name, newEmail)
                    .then(function (result) {
                        expect(result).to.be.equal('Az email címet sikeresen megváltoztattuk');
                        return testUser._id;
                    })
                    .then(coachUtils.get)
                    .then(function (user) {
                        expect(user).to.have.property('email', newEmail);
                    })
                    .nodeify(done);

            });

            it('should return invalid email format error, if email format is invalid', function (done) {

                var invalidEmail = 'foo';

                var identityService = container.get('identityService');

                identityService.changeEmail(testUser.name, invalidEmail)
                    .then(function () {
                        throw new Error('That should not be happened');
                    }, function (error) {
                        expect(error).to.have.property('message', errors.messages.invalidEmailFormat);
                    })
                    .nodeify(done);

            });

            it('should return unknown user name error, if user not found', function (done) {

                var invalidName = 'No One';

                var identityService = container.get('identityService');

                identityService.changeEmail(invalidName, newEmail)
                    .then(function () {
                        throw new Error('That should not be happened');
                    }, function (error) {
                        expect(error).to.have.property('message', errors.messages.unknownUserName);
                    })
                    .nodeify(done);
            });

            it('should return email already exist error, if email address already used by other user', function (done) {

                var identityService = container.get('identityService');

                identityService.changeEmail(testUser.name, otherTestUser.email)
                    .then(function () {
                        throw new Error('That should not be happened');
                    }, function (error) {
                        expect(error).to.have.property('message', errors.messages.emailAlreadyExist);
                    })
                    .nodeify(done);
            });
        });
    });

})();