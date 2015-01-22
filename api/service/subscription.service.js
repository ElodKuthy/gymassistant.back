(function () {
    'use strict';

    module.exports = SubscriptionService;

    SubscriptionService.$inject = ['plugins', 'users', 'errors', 'log', 'periods', 'identityService', 'trainings', 'attendees'];
    function SubscriptionService(plugins, users, errors, log, periods, identityService, trainings, attendees) {
        var self = this;
        var q = plugins.q;
        var moment = plugins.moment;
        var uuid = plugins.uuid;

        function addForToday(amount, user, coach, adminMode) {
            var deferred = q.defer();

            trainings.todayByCoach(coach.name)
                .then(function(trainings) {

                    if (trainings.length < amount) {
                        deferred.reject(errors.notEnoughTrainingsForDailyTicket());
                        return;
                    }

                    var promises = [];
                    trainings.forEach(function (training) {
                        promises.push(attendees.addToTraining(training._id, user.name, coach, adminMode));
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

        function addToSeries(amount, user, start, offset, series, coach, adminMode) {
            var deferred = q.defer();

            if (!series || !series.length || series.length === 0) {
                deferred.resolve({ result: 'Sikeres bérlet vásárlás (feliratkozások nélkül)'});
                return deferred.promise;
            }

            var promises = [];

            series.forEach(function (current) {
                promises.push(trainings.bySeriesTillOffset(current, start, offset));
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
                        console.log(adminMode);
                        promises.push(attendees.addToTraining(training._id, user.name, coach, adminMode));
                    });

                    q.allSettled(promises)
                        .then(function (results) {
                            var errors = [];
                            results.forEach(function (result) {
                                if (result.state != "fulfilled") {
                                    errors.push(result.reason.toString());
                                }
                            });
                        deferred.resolve({ result: 'Sikeres bérlet vásárlás', remarks: errors });
                    });
                });

            return deferred.promise;
        }

        self.addTillDate = function(amountPerWeek, userName, date, series, coach) {
            var deferred = q.defer();

            var amountParsed = parseInt(amountPerWeek);

            if (isNaN(amountParsed) || amountParsed < 1) {
                deferred.reject(errors.onlyPositiveIntegers());
                return deferred.promise;
            }

            var dateParsed = moment.unix(date);
            if (!dateParsed.isValid() || moment().isAfter(dateParsed)) {
                deferred.reject(errors.dateIsInPast());
                return deferred.promise;
            }


            identityService.findByName(userName)
                .then(function (user) {

                    var now = moment();
                    var expiry = moment(dateParsed).endOf('day');
                    var periodParsed = expiry.diff(now, 'days');
                    var allAmount = amountParsed * periodParsed;

                    var newCredit = {
                        id: uuid.v4(),
                        date: now.unix(),
                        expiry: expiry.unix(),
                        coach: coach.name,
                        amount: allAmount,
                        free: allAmount
                    };

                    users.addCredit(user._id, newCredit)
                        .then(function() {

                            addToSeries(amountParsed, user, periodParsed, series, coach)
                                 .then(function (result) {
                                    deferred.resolve(result);
                                }, function (error) {
                                    deferred.reject(error);
                                });
                        }, function (error) {
                            deferred.reject(error);
                        });

                }, function (error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        self.add = function(args) { // amount, client, period, date, series, coach, admin

            if (!args.client || !args.coach) {
                throw errors.serverError();
            }

            var amount = parseInt(args.amount);
            var period = periods.parse(args.period);
            var date = parseInt(args.date);

            if (isNaN(amount) || amount < 1) {
                throw errors.onlyPositiveIntegers();
            }

            if (!period) {
                throw errors.invalidPeriod();
            }

            var newCredit = {
                id: uuid.v4(),
                date: date ? date : moment().unix(),
                expiry: moment().add({ days: period.days() }).endOf('day').unix(),
                coach: args.coach.name,
                amount: amount,
                free: amount
            };

            return users.addCredit(args.client._id, newCredit)
                .then(function() {
                    if (period === periods.today) {
                        return addForToday(amount, args.client, args.coach, args.admin);
                    } else {
                        return addToSeries(amount, args.client, newCredit.date, period.days(), args.series, args.coach, args.admin);
                    }
                });

        };
    }
})();