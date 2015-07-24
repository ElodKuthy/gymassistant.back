(function () {
    'use strict';

    module.exports = IdentityService;

    IdentityService.$inject = ['plugins', 'log', 'users', 'errors', 'roles', 'mailerService', 'trainings'];

    function IdentityService(plugins, log, users, errors, roles, mailerService, trainings) {
        var self = this;
        var q = plugins.q;
        var crypto = plugins.crypto;
        var moment = plugins.moment;
        var uuid = plugins.uuid;
        var generatePassword = plugins.generatePassword;
        var validator = plugins.validator;

        var defaultPreferences = {
            askIrreversibleJoining: true,
            expirationNotification: true
        }

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

            return findByNameFull(args.userName)
                .then(function (result) {

                    if (result.hash === hashBase64) {
                        var user = {
                            _id: result._id,
                            name: result.name,
                            email: result.email,
                            roles: result.roles,
                            preferences: result.preferences ? result.preferences : defaultPreferences
                        };

                        return user;
                    }

                    throw errors.invalidUserNameOrPassword();
                });
        };

        function findByNameFull(name) {

            return users.byNameFull(name)
                .then(function (results) {
                    if (results.length != 1) {
                        throw errors.invalidUserNameOrPassword();
                    }

                    return q.when(results[0]);
                });
        }

        function checkEmailFree(args) {
            return users.byEmail(args.email)
                .then(function (results) {
                    if (results.length > 0) {
                        throw errors.emailAlreadyExist();
                    }

                    return args;
                });
        }

        self.changeEmail = function (args) {

            return q(args)
                .then(self.checkCoach)
                .then(findUser)
                .then(checkEmailFormat)
                .then(checkEmailFree)
                .then(updateEmail);

            function updateEmail(args) {
                return users.updateEmail(args.client._id, args.email);
            }

        };

        function findUser(args) {
            return findByNameFull(args.name)
                .then(function (client) {
                    args.client = client;
                    return args;
                })
                .catch(function () {
                    throw errors.unknownUserName();
                });
        }

        function checkEmailFormat(args) {
            if (!validator.isEmail(args.email)) {
                throw errors.invalidEmailFormat();
            }

            return args;
        }

        function setPasswordToken(args) {
            var hash = {
                token: uuid.v4(),
                expiry: moment().add(args.offset).unix(),
                old: args.client.hash
            };
            args.token = hash.token;

            return users.updateHash(args.client._id, hash).thenResolve(args);
        }

        self.resetPassword = function (args) {

            args.offset = {
                day: 1
            };

            return findUser(args)
                .then(checkEmailFormat)
                .then(checkEmail)
                .then(setPasswordToken)
                .then(mailerService.sendForgottenPasswordMail)
                .then(function () {
                    return 'OK';
                })
                .catch(function (err) {
                    if (err.message == errors.messages.unknownUserEmail ||
                        err.message == errors.messages.unknownUserName) {
                        return 'OK';
                    } else {
                        throw err;
                    }
                });

            function checkEmail(args) {

                if (args.client.email != args.email) {
                    throw errors.unknownUserEmail();
                }

                return args;
            }
        };

        self.changePassword = function (args) {

            return q(args)
                .then(checkPassword)
                .then(checkUser)
                .then(updateHash)
                .then(mailerService.sendChangedPasswordMail);

            function checkPassword(args) {

                if (!args.password) {
                    throw errors.missingProperty('Jelszó változtatás', 'Új jelszó');
                }

                return args;
            }

            function checkUser(args) {

                if (args.user) {
                    args.userName = args.user.name;
                    return args;
                }

                if (!args.token || !args.userName) {
                    throw errors.missingProperty('Jelszó változtatás', 'Felhasználó azonosítás');
                }

                return q(args.userName)
                    .then(findByNameFull)
                    .then(function (user) {
                        if (args.token != user.hash.token) {
                            throw errors.invalidToken();
                        }

                        if (moment().isAfter(moment.unix(user.hash.expiry))) {
                            throw errors.expiredToken();
                        }

                        args.user = user;

                        return args;
                    });
            }

            function updateHash(args) {

                args.user.hash = self.createHash(args.password);

                return users.updateHash(args.user._id, args.user.hash)
                    .then(function () {
                        return args
                    });
            }
        };

        function checkUserNameFree(args) {
            return users.byName(args.userName)
                .then(function (results) {
                    if (results.length > 0) {
                        throw errors.userNameAlreadyExist();
                    }
                    return args;
                });
        };

        self.addClient = function (args) {

            args.roles = [roles.client];

            return q(args)
                .then(self.checkCoach)
                .then(addUser)
                .then(mailerService.sendRegistrationMail);
        };

        self.addCoach = function (args) {

            args.roles = [roles.client, roles.coach];

            return q(args)
                .then(self.chechAdmin)
                .then(addUser)
                .then(mailerService.sendCoachRegistrationMail);
        };

        self.resendRegistrationEmail = function (args) {

            args.offset = {
                month: 1
            };

            return q(args)
                .then(self.chechAdmin)
                .then(findUser)
                .then(setPasswordToken)
                .then(sendEmail);

            function sendEmail(args) {

                if (roles.isCoach(args.client)) {
                    return mailerService.sendCoachRegistrationMail(args);
                } else {
                    return mailerService.sendRegistrationMail(args);
                }
            }
        }

        function addUser(args) {

            args.offset = {
                month: 1
            };

            return q(args)
                .then(checkUserNameFree)
                .then(checkEmailFormat)
                .then(checkEmailFree)
                .then(createUser)
                .then(addUser)
                .then(setPasswordToken);

            function createUser(args) {

                var client = {
                    _id: uuid.v4(),
                    name: args.userName,
                    email: args.email,
                    registration: moment().unix(),
                    roles: args.roles,
                    qr: uuid.v4(),
                    credits: [],
                    type: 'user'
                };

                args.client = client;

                return args;
            }

            function addUser(args) {
                return users.add(args.client).thenResolve(args);
            }
        }

        self.findByName = function (name) {

            return users.byName(name)
                .then(function (results) {
                    if (results.length != 1) {
                        throw errors.unknownUserName();
                    }

                    return q.when(results[0]);
                });
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

        self.checkLoggedIn = function (args) {
            if (!args.user) {
                throw errors.unauthorized();
            }

            return args;
        };

        self.checkCoach = function (args) {
            if (!args.user) {
                throw errors.invalidUserNameOrPassword();
            }

            if (!roles.isCoach(args.user)) {
                throw errors.unauthorized();
            }

            return args;
        };

        self.checkAdmin = function (args) {
            if (!args.user) {
                throw errors.invalidUserNameOrPassword();
            }

            if (!roles.isAdmin(args.user)) {
                throw errors.unauthorized();
            }

            return args;
        };

        self.changeName = function (args) {

            if (!args.name) {
                throw errors.missingProperty('Beállítások', 'Eredeti név');
            }

            if (!args.userName) {
                throw errors.missingProperty('Beállítások', 'Új név');
            }

            return q(args)
                .then(self.checkAdmin)
                .then(findUser)
                .then(checkUserNameFree)
                .then(changeName)
                .then(updateTrainings);
        }

        function changeName(args) {
            return users.updateName(args.client._id, args.userName).thenResolve(args);
        }

        function updateTrainings(args) {

            return trainings.byDate()
                .then(function (allTrainings) {
                    var updates = [];
                    allTrainings.forEach(function (training) {
                        for (var index = 0; index < training.attendees.length; index++) {
                            if (training.attendees[index].name == args.name) {
                                training.attendees[index].name = args.userName;
                                updates.push(trainings.updateAttendees(training._id, training.attendees));
                                break;
                            }
                        }
                    });

                    return q.allSettled(updates).thenResolve(args);
                });
        }

        self.updatePreferences = function (args) {

            return q(args)
                .then(self.checkLoggedIn)
                .then(function (args) {
                    if (!args.preferences) {
                        throw errors.missingProperty('Beállítások', 'Új beállítások');
                    }

                    return users.updatePreferences(args.user._id, args.preferences)
                        .thenResolve(args.preferences);

                });
        }

        self.unsubscribe = function (args) {

            return q(args)
                .then(findUserByUnsubsribeId)
                .then(unsubscribeUser);
        }

        function findUserByUnsubsribeId(args) {

            if (!args.id) {
                throw errors.missingProperty('Leiratkozás', 'Id');
            }

            return users.byNameFull()
                .then(function (results) {

                    results.some(function (user) {
                        if (user.preferences && user.preferences.id == args.id) {
                            args.user = user;
                            return true;
                        }
                    });

                    return args;
                });
        }

        function unsubscribeUser(args) {

            if (!args.user) {
                throw errors.invalidToken();
            }

            args.user.preferences.expirationNotification = args.expirationNotification;

            return users.updatePreferences(args.user._id, args.user.preferences)
                .thenResolve(args.preferences);
        }
    }
})();