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

        self.parseBasicAuthorizationHeader = function (authorizationHeader) {

            if (!authorizationHeader) {
                return q.when(null);
            }

            if (authorizationHeader.indexOf('Basic ') !== 0) {
                throw errors.invalidUserNameOrPassword();
            }

            var base64 = authorizationHeader.replace('Basic ', '');

            if (!validator.isBase64(base64)) {
                throw errors.invalidUserNameOrPassword();
            }

            base64 = new Buffer(base64, 'base64');
            var userNameAndPassword = unescape(decodeURIComponent(base64.toString('utf8')));
            userNameAndPassword = userNameAndPassword.split(':');

            if (userNameAndPassword.length != 2) {
                throw errors.invalidUserNameOrPassword();
            }

            return {
                userName: userNameAndPassword[0],
                password: userNameAndPassword[1]
            };
        };

        self.authenticate = function (args) {

            if (!args || !args.userName || !args.password) {
                return q.when(null);
            }

            var hashBase64 = self.createHash(args.password);

            return users.byNameFull(args.userName)
                .then(function (results) {
                    if (results.length != 1) {
                        throw errors.invalidUserNameOrPassword();
                    }

                    var result = results[0];
                    if (result.hash === hashBase64) {
                        var user = {
                            _id: result._id,
                            name: result.name,
                            email: result.email,
                            roles: result.roles
                        };

                        return user;
                    }

                    throw errors.invalidUserNameOrPassword();
                });
        };

        self.changeEmail = function(name, email) {

            return q.all([
                    self.findByName(name),
                    self.checkEmailFormat(email),
                    self.checkEmailFree(email)
                ])
                .spread(function (user) {
                    return users.updateEmail(user._id, email);
                })
                .thenResolve('Az email címet sikeresen megváltoztattuk');
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

        self.checkUserNameFree = function (userName) {
            return users.byName(userName)
                .then(function (results) {
                    if (results.length > 0) {
                        throw errors.userNameAlreadyExist();
                    }
                });
        };

        self.checkEmailFormat = function (email) {
            if (!validator.isEmail(email)) {
                return q.reject(errors.invalidEmailFormat());
            }
        };

        self.checkEmailFree = function (email) {
            return users.byEmail(email)
                .then(function (results) {
                    if (results.length > 0) {
                        throw errors.emailAlreadyExist();
                    }
                });
        };

        self.addClient = function (userName, email) {
            return addUser(userName, email, [roles.client]);
        };

        self.addCoach = function (userName, email) {
            return addUser(userName, email, [roles.client, roles.coach]);
        };

        function addUser (userName, email, roles) {

            var password = generatePassword(8, false);

            return q.all([
                    self.checkUserNameFree(userName),
                    self.checkEmailFormat(email),
                    self.checkEmailFree(email)
                ])
                .then(function () {

                    var user = {
                        _id: uuid.v4(),
                        name: userName,
                        email: email,
                        registration: moment().unix(),
                        roles: roles,
                        qr: uuid.v4(),
                        hash: self.createHash(password),
                        credits: [],
                        type: 'user'
                    };

                    return user;
                })
                .tap(users.add)
                .then(function (user) {
                    return { user: user, password: password };
                });
        }

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

        self.checkLoggedIn2 = function(user) {
            if (!user) {
                throw errors.unauthorized();
            }

            return q.when(user);
        };

        self.checkCoach = function(user) {
            if (!user) {
                return errors.invalidUserNameOrPassword();
            }

            if (!roles.isCoach(user)) {
                return errors.unauthorized();
            }
        };

        self.checkCoach2 = function(user) {
            if (!user) {
                throw errors.invalidUserNameOrPassword();
            }

            if (!roles.isCoach(user)) {
                throw errors.unauthorized();
            }

            return q.when(user);
        };

        self.checkAdmin = function(user, result) {
            if (!user) {
                throw errors.invalidUserNameOrPassword();
            }

            if (!roles.isAdmin(user)) {
                throw errors.unauthorized();
            }

            return q.when(result ? result : user);
        };
    }
})();