(function () {
    'use strict';

    module.exports = Credits;

    Credits.$inject = ['plugins', 'users', 'errors', 'log'];
    function Credits(plugins, users, errors, log) {
        var self = this;
        var q = plugins.q;
        var moment = plugins.moment;
        var uuid = plugins.uuid;

        self.getUserCreditsFromName = function(userName) {
            var deferred = q.defer();

            users.creditsByName(userName)
                .then(function(results) {
                    if (results.length != 1) {
                        deferred.reject(errors.unknownUserName());
                    } else {
                        deferred.resolve(results[0]);
                    }
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        self.getUserCredits = function(user) {
            var deferred = q.defer();

            users.creditsById(user._id)
                .then(function(results) {
                    if (results.length != 1) {
                        deferred.reject(errors.unknownUserName());
                    } else {
                        deferred.resolve(results[0]);
                    }
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        self.bookFreeCredit = function(user, coach) {
            var deferred = q.defer();

            function error(err) {
                deferred.reject(err);
            }

            self.getUserCredits(user).then(getUserCreditsSuccess, error);

            function getUserCreditsSuccess(credits) {
                log.debug('credits length: ' + credits.length);
                log.debug('credits: ' + credits);
                var creditToBook;
                if (credits) {
                    for (var index = 0; index < credits.length; index++) {
                        var current = credits[index];
                        if (moment().isBefore(moment.unix(current.expiry)) && current.free > 0) {
                            creditToBook = current;
                            if (creditToBook.coach === coach) {
                                break;
                            }
                        }
                    }
                }


                if (!creditToBook) {
                    deferred.reject(errors.noCredit());
                    return;
                }

                users.decreaseFreeCredit(user._id, creditToBook.id).then(decreaseFreeCreditSuccess, error);

                function decreaseFreeCreditSuccess(result) {
                    deferred.resolve(creditToBook);
                }
            }

            return deferred.promise;
        };
    }
})();