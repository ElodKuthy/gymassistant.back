(function () {
    'use strict';

    module.exports = IdentityService;

    IdentityService.$inject = ['plugins', 'log', 'users', 'errors', 'roles'];
    function IdentityService(plugins, log, users, errors, roles) {
        var self = this;
        var q = plugins.q;
        var crypto = plugins.crypto;
        var moment = plugins.moment;
        var uuid = plugins.uuid;
        var generatePassword = plugins.generatePassword;
        var validator = plugins.validator;

        self.createHash = function (password) {
            var sha512 = crypto.createHash('sha512');
            sha512.update(password, 'utf8');
            var hash = sha512.digest(password);
            return hash.toString('base64');
        };

        self.authenticate = function (authorizationHeader) {

            var deferred = q.defer();

            if (!authorizationHeader) {
                log.info('Anonymus request');
                deferred.resolve(null);
            } else {
                try {
                    var base64 = authorizationHeader.replace('Basic ', '');
                    base64 = new Buffer(base64, 'base64');
                    var userNameAndPassword = unescape(decodeURIComponent(base64.toString('utf8')));
                    log.debug(userNameAndPassword);
                    userNameAndPassword = userNameAndPassword.split(':');
                    var userName = userNameAndPassword[0];
                    var password = userNameAndPassword[1];
                    var hashBase64 = self.createHash(password);

                    users.byNameFull(userName)
                        .then(function (results) {
                            var result = results[0];
                            if (result.hash === hashBase64) {
                                    var user = {
                                        _id: result._id,
                                        name: result.name,
                                        email: result.email,
                                        roles: result.roles
                                    };
                                    log.info('Authenticated as ' + user.name);
                                    deferred.resolve(user);
                            }

                            deferred.reject(errors.invalidUserNameOrPassword);
                        }, function (error) {
                            deferred.reject(errors.invalidUserNameOrPassword);
                        });

                } catch (error) {
                    log.error(error.stack);
                    deferred.reject(errors.invalidUserNameOrPassword);
                }
            }

            return deferred.promise;
        };

        self.changeEmail = function(name, email) {
            var deferred = q.defer();

            if (validator.isEmail(email)) {
                self.findByName(name).then(userFound, error);
            } else {
                error(errors.invalidEmailFormat());
            }

            function userFound(user) {
                try {
                    users.updateEmail(user._id, email).then(emailUpdated, error);
                } catch (err) {
                    error(err);
                }
            }

            function emailUpdated() {
                deferred.resolve('Az email címet sikeresen megváltoztattuk');
            }

            function error (err) {
                deferred.reject(err);
            }

            return deferred.promise;
        };

        self.resetPassword = function (user) {
            var password = generatePassword(8, false);
            return self.changePassword(user, password)
                .then(function () { return { user: user, password: password }; });
        };

        self.changePassword = function(user, newPassword) {
            var deferred = q.defer();

            user.hash = self.createHash(newPassword);

            users.updateHash(user._id, user.hash)
                .then(function() {
                    deferred.resolve('A jelszót sikeresen megváltoztattuk');
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        self.addUser = function(userName, email) {
            var deferred = q.defer();

            users.byName(userName)
                .then(function (results) {

                    if (results.length > 0) {
                        deferred.reject(errors.userNameAlreadyExist());
                        return;
                    }

                    var password = generatePassword(8, false);

                    var user = {
                        _id: uuid.v4(),
                        name: userName,
                        email: email,
                        registration: moment().unix(),
                        roles: [roles.client],
                        qr: uuid.v4(),
                        hash: self.createHash(password),
                        credits: [],
                        type: 'user'
                    };

                    users.add(user)
                        .then(function() {
                            deferred.resolve({ user: user, password: password });
                        }, function (error) {
                            deferred.reject(error);
                        });
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        self.findByName = function (name) {
            var deferred = q.defer();

            users.byName(name).then(byName, error);

            function byName(results) {
                try {
                    if (results.length === 0) {
                        deferred.reject(errors.unknownUserName());
                    } else {
                        deferred.resolve(results[0]);
                    }
                } catch (err) {
                    error(err);
                }
            }

            function error(err) {
                deferred.reject(err);
            }

            return deferred.promise;
        };

        self.findByEmail = function (email) {
            return users.byEmail(email)
                .then(function (results) {
                    if (results.length === 0) {
                        throw errors.unknownUserEmail();
                    }

                    return results[0];
                });
        };

        self.checkLoggedIn = function(user) {
            if (!user) {
                return errors.unauthorized();
            }
        };

        self.checkCoach = function(user) {
            if (!user) {
                return errors.invalidUserNameOrPassword();
            }

            if (!roles.isCoach(user)) {
                return errors.unauthorized();
            }
        };

        self.checkAdmin = function(user) {
            if (!user) {
                return errors.invalidUserNameOrPassword();
            }

            if (!roles.isAdmin(user)) {
                return errors.unauthorized();
            }
        };
    }
})();