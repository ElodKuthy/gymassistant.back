(function () {
    'use strict';

    module.exports = CreditsService;

    CreditsService.$inject = ['plugins', 'users', 'errors', 'log', 'trainings'];
    function CreditsService(plugins, users, errors, log, trainings) {
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

        self.getUserCreditsFromName = function (userName) {

            return users.creditsByName(userName)
                .then(parseCredits)
                .then(decorateCredits);
        };

        self.getUserCredits = function (user) {

            return users.creditsById(user._id)
                .then(parseCredits)
                .then(decorateCredits);
        };

        function findCreditToBook(credits, training, adminMode) {

            var now = moment().unix();
            var creditToBook;
            if (credits) {
                for (var index = 0; index < credits.length; index++) {
                    var current = credits[index];
                    console.log('training.date: ' + training.date);
                    console.log('current.date: ' + current.date);
                    console.log('current.expiry: ' + current.expiry);
                    console.log('adminMode: ' + adminMode);
                    if ((current.date * 1000 < training.date && current.expiry * 1000 > training.date) &&
                        (current.expiry > now || adminMode) &&
                        current.free > 0) {
                        creditToBook = current;
                        if (creditToBook.coach === training.coach) {
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

        self.bookFreeCredit = function (user, training, adminMode) {

            return self.getUserCredits(user)
                .then(function (credits) {
                    return findCreditToBook(credits, training, adminMode); })
                .tap(function (creditToBook) {
                    return users.decreaseFreeCredit(user._id, creditToBook.id);
                });

        };
    }
})();