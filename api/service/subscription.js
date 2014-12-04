(function () {
    'use strict';

    module.exports = Subscription;

    Subscription.$inject = ['plugins', 'users', 'errors', 'log', 'periods', 'identity', 'trainings', 'attendees'];
    function Subscription(plugins, users, errors, log, periods, identity, trainings, attendees) {
        var self = this;
        var q = plugins.q;
        var moment = plugins.moment;
        var uuid = plugins.uuid;

        function addForToday(amount, user, coach) {
            var deferred = q.defer();

            trainings.todayByCoach(coach.name)
                .then(function(trainings) {

                    if (trainings.length < amount) {
                        deferred.reject(errors.notEnoughTrainingsForDailyTicket());
                        return;
                    }

                    var promises = [];
                    trainings.forEach(function (training) {
                        promises.push(attendees.addToTraining(training._id, user.name, coach));
                    });

                    q.allSettled(promises)
                        .then(function (results) {
                            var errors = [];
                            results.forEach(function (result) {
                                if (result.state != "fulfilled") {
                                    errors.push(result.reason);
                                }
                            });
                        deferred.resolve({ result: 'Sikeres napijegy vásárlás', remarks: errors });
                    });
                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        }

        function addToSeries(amount, user, period, series, coach) {
            var deferred = q.defer();

            if (!series || !series.length || series.length === 0) {
                deferred.resolve({ result: 'Sikeres bérlet vásárlás (feliratkozások nélkül)'});
                return deferred.promise;
            }

            var promises = [];

            series.forEach(function (current) {
                promises.push(trainings.bySeriesTillOffset(current, period.days()));
            });

            var trainingsToAdd = [];

            q.allSettled(promises)
                .then(function (results) {
                    results.forEach(function (result) {
                        if (result.state === "fulfilled") {
                            trainingsToAdd = trainingsToAdd.concat(result.value);
                        } else {
                            log.error(result.reason);
                        }
                    });

                    var promises = [];

                    trainingsToAdd.forEach(function (training) {
                        promises.push(attendees.addToTraining(training._id, user.name, coach));
                    });

                    q.allSettled(promises)
                        .then(function (results) {
                            var errors = [];
                            results.forEach(function (result) {
                                if (result.state != "fulfilled") {
                                    errors.push(result.reason);
                                }
                            });
                        deferred.resolve({ result: 'Sikeres bérlet vásárlás', remarks: errors });
                    });
                });

            return deferred.promise;
        }

        self.add = function(amount, userName, period, series, coach) {
            var deferred = q.defer();

            var amountParsed = parseInt(amount);
            var periodParsed = periods.parse(period);

            if (isNaN(amountParsed) || amountParsed < 1) {
                deferred.reject(errors.onlyPositiveIntegers());
                return deferred.promise;
            }

            if (!periodParsed) {
                deferred.reject(errors.invalidPeriod());
                return deferred.promise;
            }

            identity.findByName(userName)
                .then(function (results) {
                    var user = results[0];

                    var newCredit = {
                        id: uuid.v4(),
                        date: moment().unix(),
                        expiry: moment().add({ days: periodParsed.days() }).endOf('day').unix(),
                        coach: coach.name,
                        amount: amount,
                        free: amount
                    };

                    users.addCredit(user._id, newCredit)
                        .then(function() {
                            if (periodParsed === periods.today) {
                                addForToday(amountParsed, user, coach)
                                    .then(function (result) {
                                        deferred.resolve(result);
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                            } else {
                                addToSeries(amountParsed, user, periodParsed, series, coach)
                                     .then(function (result) {
                                        deferred.resolve(result);
                                    }, function (error) {
                                        deferred.reject(error);
                                    });
                            }
                        }, function (error) {
                            deferred.reject(error);
                        });

                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };
    }
})();