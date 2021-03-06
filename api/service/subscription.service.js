(function () {
    'use strict';

    module.exports = SubscriptionService;

    SubscriptionService.$inject = ['plugins', 'users', 'errors', 'log', 'periods', 'identityService', 'trainings', 'attendeesService'];

    function SubscriptionService(plugins, users, errors, log, periods, identityService, trainings, attendeesService) {
        var self = this;
        var q = plugins.q;
        var moment = plugins.moment;
        var uuid = plugins.uuid;

        self.add = function (args) {

            return q(args)
                .then(findUser)
                .then(checkArgs)
                .then(adjustExpiryDate)
                .then(addCredit)
                .then(addToTrainings);
        };

        function findUser(args) {

            return identityService.findByName(args.userName)
                .then(function (client) {
                    args.client = client;
                    return args;
                });
        }

        function checkArgs(args) {

            if (args.firstTime && args.client.credits.length > 0) {
                throw errors.notFirstTime();
            }

            args.amount = args.firstTime ? 1 : parseInt(args.amount);
            args.period = args.firstTime ? periods.today : periods.parse(args.period);

            if (isNaN(args.amount) || args.amount < 1) {
                throw errors.onlyPositiveIntegers();
            }

            if (!args.period) {
                throw errors.invalidPeriod();
            }

            if (!args.date || !moment(args.date).isValid) {
                args.date = moment().startOf('day').unix();
            }

            if (args.coachName) {
                return q(args)
                    .then(identityService.checkAdmin)
                    .then(function () {
                        return identityService.findByName(args.coachName);
                    })
                    .then(function (coach) {
                        args.coach = coach;
                    })
                    .thenResolve(args);
            } else {
                args.coach = args.user;
                return identityService.checkCoach(args);
            }
        }

        function adjustExpiryDate(args) {

            if (!args.firstTime) {
                args.expiry = moment.unix(args.date).add({
                    days: args.period.days()
                }).endOf('day').unix();

                if (args.period != periods.today) {
                    var latestExpiry = 0;
                    args.client.credits.forEach(function (credit) {
                        if (credit.expiry > latestExpiry && credit.coach == args.coach.name) {
                            latestExpiry = credit.expiry;
                        }
                    });

                    if (latestExpiry > args.date) {
                        args.expiry += (latestExpiry - args.date);
                    }
                }
            }

            return args;
        }

        function addCredit(args) {

            args.newCredit = args.firstTime ? {
                id: uuid.v4(),
                date: moment.unix(args.date).startOf('day').unix(),
                expiry: moment.unix(args.date).endOf('day').unix(),
                coach: args.coach.name,
                amount: 1,
                free: 1,
                firstTime: true
            } : {
                id: uuid.v4(),
                date: moment.unix(args.date).startOf('day').unix(),
                expiry: moment.unix(args.expiry).endOf('day').unix(),
                coach: args.coach.name,
                amount: args.amount,
                free: args.amount
            };

            return users.addCredit(args.client._id, args.newCredit).thenResolve(args);
        }

        function addToTrainings(args) {

            if (!args.series || !args.series.length || args.series.length === 0) {
                return {
                    result: 'Sikeres bérlet vásárlás (feliratkozások nélkül)'
                };
            }

            var promises = [];
            var offset = Math.round((args.newCredit.expiry - args.newCredit.date) / 86400);

            args.series.forEach(function (current) {
                promises.push(trainings.bySeriesTillOffset(current, args.date, offset));
            });

            var trainingsToAdd = [];

            return q.allSettled(promises)
                .then(function (results) {
                    results.forEach(function (result) {
                        if (result.state === "fulfilled") {
                            trainingsToAdd = trainingsToAdd.concat(result.value);
                        } else {
                            log.error(result.reason);
                        }
                    });

                    trainingsToAdd.sort(function (a, b) {
                        return a.date - b.date;
                    });

                    var errors = [];

                    function addToTraining(index) {
                        if (index === trainingsToAdd.length) {
                            return {
                                result: 'Sikeres bérlet vásárlás',
                                remarks: errors
                            };
                        }

                        args.id = trainingsToAdd[index]._id;

                        return attendeesService.addToTraining(args)
                            .then(function () {
                                return addToTraining(index + 1);
                            }, function (error) {
                                errors.push(error);
                                return addToTraining(index + 1);
                            });
                    }

                    return addToTraining(0);
                });
        }

        self.getActiveSubscriptions = function (args) {

            return q(args)
                .then(identityService.checkAdmin)
                .then(getAllUser)
                .then(countActiveSubscriptions);
        };

        function getAllUser(args) {
            return users.byNameAll().then(function (results) {
                args.clients = results;
                return args;
            });
        }

        function countActiveSubscriptions(args) {

            var results = {
                distinct: 0,
                all: 0
            };
            var countedNames = {
                overall: []
            };

            args.clients.forEach(function (client) {

                client.credits.forEach(function (credit) {

                    if (moment.unix(credit.expiry).isAfter(args.from, 'day') &&
                        moment.unix(credit.date).isBefore(args.to, 'day')) {

                        if (!results[credit.coach]) {
                            results[credit.coach] = {
                                distinct: 0,
                                all: 0,
                                subscriptions: []
                            };
                            countedNames[credit.coach] = {};
                        }

                        results[credit.coach].subscriptions.push({
                            id: credit.id,
                            client: client.name,
                            email: client.email,
                            date: credit.date,
                            expiry: credit.expiry,
                            amount: credit.amount
                        });

                        if (!countedNames.overall[client.name]) {
                            countedNames.overall[client.name] = true;
                            results.distinct++;
                        }

                        if (!countedNames[credit.coach][client.name]) {
                            countedNames[credit.coach][client.name] = true;
                            results[credit.coach].distinct++;
                        }

                        results[credit.coach].all++;
                        results.all++;
                    }
                });
            });

            return results;
        }
    }
})();