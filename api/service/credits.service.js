(function () {
    'use strict';

    module.exports = CreditsService;

    CreditsService.$inject = ['plugins', 'users', 'errors', 'log', 'trainings', 'identityService', 'roles'];
    function CreditsService(plugins, users, errors, log, trainings, identityService, roles) {
        var self = this;
        var q = plugins.q;
        var moment = plugins.moment;
        var uuid = plugins.uuid;

        function parseCredits (results) {
            if (results.length != 1) {
                throw errors.unknownUserName();
            } else {
                return results[0];
            }
        }

        function decorateCredit (credit) {
            var now = moment().unix();
            credit.participated = 0;
            credit.missed = 0;
            credit.attended = 0;

            return trainings.byDate([credit.date * 1000, credit.expiry * 1000])
                .then(function (trainings) {

                    trainings.forEach(function (training) {
                        training.attendees.forEach(function (attendee) {
                            if (attendee.ref === credit.id) {
                                if (training.date < now) {
                                    if (attendee.checkedIn) {
                                        credit.participated++;
                                    } else {
                                        credit.missed++;
                                    }
                                } else {
                                    credit.attended++;
                                }
                            }
                        });
                    });
                    return credit;
                });

        }

        function decorateCredits (credits) {

            var promises = [];

            credits.forEach(function (credit) {
                promises.push(decorateCredit(credit));
            });

            return q.all(promises);
        }

        self.getUserCredits = function (args) {

            if (!args.userName) {
                throw errors.missingProperty('Kreditlekérdezés', 'Tanítvány neve');
            }

            return q(args)
                .then(identityService.checkCoach)
                .then(function () { return users.creditsByName(args.userName); })
                .then(parseCredits)
                .then(decorateCredits);
        };

        self.getCredits = function (args) {

            return q(args)
                .then(identityService.checkLoggedIn)
                .then(function () { return users.creditsByName(args.user.name); })
                .then(parseCredits)
                .then(decorateCredits);
        };

        function findCreditToBook(args) {

            var adminMode = roles.isAdmin(args.user.roles);
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
                .then(function (credits) {
                    args.credits = credits;
                    return findCreditToBook(args); })
                .tap(function (creditToBook) {
                    return users.decreaseFreeCredit(args.client._id, creditToBook.id);
                });

        };
    }
})();