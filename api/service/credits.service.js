(function () {
    'use strict';

    module.exports = CreditsService;

    CreditsService.$inject = ['plugins', 'users', 'errors', 'log', 'trainings', 'identityService', 'roles'];
    function CreditsService(plugins, users, errors, log, trainings, identityService, roles) {
        var self = this;
        var q = plugins.q;
        var moment = plugins.moment;
        var uuid = plugins.uuid;

        function parseCredits(args) {
            if (args.credits.length != 1) {
                throw errors.unknownUserName();
            } else {
                args.credits = args.credits[0];
            }

            return args;
        }

        function decorateCredit (credit, details) {
            var now = moment().unix();
            var add;

            if (details == 'full') {
                credit.participated = [];
                credit.missed = [];
                credit.attended = [];
                add = function(counter, training) {
                    counter.push({
                        id: training._id,
                        name: training.name,
                        date: training.date,
                        coach: training.coach
                    });

                    return counter;
                }
            } else {
                credit.participated = 0;
                credit.missed = 0;
                credit.attended = 0;
                add = function(counter) { return counter + 1; }
            }

            return trainings.byDate([credit.date * 1000, credit.expiry * 1000])
                .then(function (trainings) {

                    trainings.forEach(function (training) {
                        training.attendees.forEach(function (attendee) {
                            if (attendee.ref === credit.id) {
                                if (training.date < now) {
                                    if (attendee.checkedIn) {
                                        credit.participated = add(credit.participated, training);
                                    } else {
                                        credit.missed = add(credit.missed, training);
                                    }
                                } else {
                                    credit.attended = add(credit.attended, training);
                                }
                            }
                        });
                    });
                    return credit;
                });

        }

        function decorateCredits (args) {

            var promises = [];

            args.credits.forEach(function (credit) {
                promises.push(decorateCredit(credit, args.details));
            });

            return q.all(promises).then(function (results) {
                args.credits = results;
                return args;
            });
        }

        function findCredits(args) {

            var promise = args.userName ? users.creditsByName(args.userName) : users.creditsByName(args.user.name);

            return promise.then(function (credits) {
                args.credits = credits;
                return args;
            });
        }

        self.getUserCredits = function (args) {

            if (!args.userName) {
                throw errors.missingProperty('Kreditlekérdezés', 'Tanítvány neve');
            }

            return q(args)
                .then(identityService.checkCoach)
                .then(findCredits)
                .then(parseCredits)
                .then(decorateCredits);
        };

        self.getCredits = function (args) {

            return q(args)
                .then(identityService.checkLoggedIn)
                .then(findCredits)
                .then(parseCredits)
                .then(decorateCredits);
        };

        function findCredit(args) {

            for (var index = 0; index < args.credits.length; index++) {
                if (args.credits[index].id == args.id) {
                    args.credit = args.credits[index];
                    break;
                }
            }

            if (!args.credit) {
                throw errors.invalidCreditId();
            }

            return args;
        }

        self.getCredit = function (args) {

            if (!args.id) {
                throw errors.missingProperty('Kreditlekérdezés', 'Kreditazonosító');
            }

            return q(args)
                .then(args.userName ? self.getUserCredits : self.getCredits)
                .then(findCredit)
                .then(function (args) { return args.credit; });
        }

        self.updateCredit = function(args) {

            return q(args)
                .then(identityService.checkAdmin)
                .then(findUser)
                .then(findCredits)
                .then(parseCredits)
                .then(findCredit)
                .then(updateExpiry)
                .then(updateFreeCredits);
        }

        function findUser(args) {
            return users.byName(args.userName)
                .then(function (results) {
                    if (results.length != 1) {
                        throw errors.unknownUserName();
                    }

                    args.client = results[0];
                    return args;
                })
        }

        function updateExpiry(args) {
            if (args.addWeek) {

                if (args.credit.firstTime) {
                    throw errors.firstTimeModification();
                }

                return users.increaseExpiry(args.client._id, args.credit.id, 604800).thenResolve(args);
            }

            return args;
        }

        function updateFreeCredits(args) {
            if (args.addFreeCredit) {

                if (args.credit.firstTime) {
                    throw errors.firstTimeModification();
                }

                return users.increaseFreeCredit(args.client._id, args.credit.id).thenResolve(args);
            }

            return args;
        }
        function findCreditToBook(args) {

            var adminMode = roles.isAdmin(args.user);
            var now = moment().unix();
            var creditToBook;
            if (args.credits) {
                for (var index = 0; index < args.credits.length; index++) {
                    var current = args.credits[index];
                    if ((current.date * 1000 < args.training.date && current.expiry * 1000 > args.training.date) &&
                        (current.expiry > now || adminMode) &&
                        current.free > 0) {
                        creditToBook = current;
                        if (creditToBook.coach === args.training.coach) {
                            break;
                        }
                    }
                }
            }

            if (!creditToBook) {
                throw errors.noCredit();
            }

            return creditToBook;
        }

        self.bookFreeCredit = function (args) {

            return (args.user.name == args.client.name ? self.getCredits(args) : self.getUserCredits(args))
                .then(findCreditToBook)
                .then(function (creditToBook) {
                    return users.decreaseFreeCredit(args.client._id, creditToBook.id).thenResolve(creditToBook);
                });

        };
    }
})();